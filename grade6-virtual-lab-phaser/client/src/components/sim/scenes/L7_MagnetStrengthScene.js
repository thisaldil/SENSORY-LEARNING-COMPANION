import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════════
   PALETTE  –  warm workshop: cream paper + iron tones
═══════════════════════════════════════════════════ */
const P = {
  bg:            0xf5f0e8,
  bgDark:        0xe8e0d0,
  paper:         0xfdfaf4,
  paperLine:     0xe8e4da,
  tableTop:      0xd4a96a,
  tableEdge:     0xb8894a,
  tableLeg:      0xa07840,
  panelBg:       0x2c1f0e,
  panelBorder:   0x5c3a1e,
  panelAccent:   0xe8a030,

  magnetRed:     0xd42b2b,
  magnetRedDark: 0xa01818,
  magnetBlue:    0x2b4fd4,
  magnetBlueDark:0x1830a0,
  magnetMiddle:  0xe8e0d0,
  magnetMiddleDark:0xb0a898,
  magnetShine:   0xffffff,
  magnetPoleText:0xffffff,

  clipBody:      0x8a8a96,
  clipShine:     0xd0d0dc,
  clipStuck:     0x6060c8,
  clipStuckShine:0xa0a0ff,

  fieldPole:     0xff6666,
  fieldMid:      0x6699ff,
  fieldLine:     0xddddee,

  zoneRed:       0xff3333,
  zoneBlue:      0x3366ff,
  zoneMid:       0xaaaaaa,

  textDark:      0x1a1008,
  textMid:       0x5c3a1e,
  textLight:     0xf5e8c8,
  lcdBg:         0x0d1a0d,
  lcdOn:         0x44ff88,
  lcdOff:        0x0d3020,

  btnBg:         0x3a2510,
  btnHover:      0x5c3a1e,
  btnBorder:     0xe8a030,
  btnText:       0xf5e8c8,

  sparkYellow:   0xffee44,
  sparkOrange:   0xff8800,
};

/* ═══════════════════════════════════════════════════
   SCENE
═══════════════════════════════════════════════════ */
export default class L7_MagnetStrengthScene extends BaseLabScene {
  constructor(opts) {
    super("L7_MagnetStrengthScene", opts);
    this.poleStrength  = opts.labConfig?.poleStrength  ?? 1.0;
    this.midStrength   = opts.labConfig?.midStrength   ?? 0.35;
    this.maxClips      = opts.labConfig?.maxClips      ?? 20;
    this.clipsPicked   = 0;
    this._fieldAlpha   = 0;       // field lines fade-in on drag
    this._dragging     = false;
    this._prevPicked   = 0;
    this._resetFlash   = 0;
  }

  /* ─────────────────────────── CREATE ─────────────────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._W = W; this._H = H;

    this._buildBackground(W, H);
    this._buildTable(W, H);
    this._buildClips(W, H);
    this._buildMagnet(W, H);
    this._buildFieldLayer(W, H);
    this._buildPanel(W, H);
    this._buildHeader(W, H);
    this._hookDrag(W, H);
  }

  /* ─────────── BACKGROUND ─────────── */
  _buildBackground(W, H) {
    // Warm cream paper
    this.add.rectangle(W/2, H/2, W, H, P.bg);

    // Subtle paper texture lines
    const g = this.add.graphics();
    g.lineStyle(1, P.paperLine, 0.35);
    for (let y = 0; y < H; y += 22) g.lineBetween(0, y, W, y);

    // Corner shadow vignette
    const vig = this.add.graphics();
    vig.fillStyle(0x000000, 0.07);
    vig.fillRect(0, 0, W, 18);
    vig.fillRect(0, H - 18, W, 18);
  }

  /* ─────────── TABLE ─────────── */
  _buildTable(W, H) {
    const ty = H * 0.3;     // table top Y
    const th = H * 0.58;    // table surface + legs area

    // Table surface with wood grain feel
    const tg = this.add.graphics();
    // Surface
    tg.fillStyle(P.tableTop, 1);
    tg.fillRect(40, ty, W - 80, 22);
    // Surface edge highlight
    tg.fillStyle(0xffffff, 0.18);
    tg.fillRect(40, ty, W - 80, 5);
    // Surface bottom shadow
    tg.fillStyle(P.tableEdge, 1);
    tg.fillRect(40, ty + 22, W - 80, 6);

    // Legs
    [[90, 1], [W - 90, -1]].forEach(([lx, flip]) => {
      tg.fillStyle(P.tableLeg, 1);
      tg.fillRect(lx - 12, ty + 28, 24, H - ty - 28);
      // Leg highlight
      tg.fillStyle(0xffffff, 0.12);
      tg.fillRect(lx - 12, ty + 28, 8, H - ty - 28);
    });

    // Paper on table
    const pg = this.add.graphics();
    pg.fillStyle(P.paper, 1);
    pg.fillRoundedRect(70, ty + 28, W - 140, H * 0.42, 4);
    pg.lineStyle(1.5, P.paperLine, 0.8);
    pg.strokeRoundedRect(70, ty + 28, W - 140, H * 0.42, 4);

    // Paper lines
    pg.lineStyle(1, P.paperLine, 0.5);
    for (let ly = ty + 46; ly < ty + 28 + H * 0.42 - 10; ly += 18) {
      pg.lineBetween(90, ly, W - 90, ly);
    }

    this._tableY = ty + 28;
    this._tableH = H * 0.42;
  }

  /* ─────────── CLIPS ─────────── */
  _buildClips(W, H) {
    this.clips = [];
    const minX = 100, maxX = W - 100;
    const minY = this._tableY + 24, maxY = this._tableY + this._tableH - 24;

    for (let i = 0; i < this.maxClips; i++) {
      const cx = Phaser.Math.Between(minX, maxX);
      const cy = Phaser.Math.Between(minY, maxY);
      const angle = Phaser.Math.Between(-60, 60);

      const g = this.add.graphics();
      this._drawClip(g, 0, 0, angle, false);

      g.x = cx; g.y = cy;
      g.setInteractive(new Phaser.Geom.Rectangle(-8, -10, 16, 20), Phaser.Geom.Rectangle.Contains);

      this.clips.push({
        gfx: g,
        homeX: cx, homeY: cy,
        angle,
        stuck: false,
        stuckAngle: 0,
        offsetX: 0, offsetY: 0,
      });
    }
  }

  _drawClip(g, x, y, angle, stuck) {
    g.clear();
    const cos = Math.cos(angle * Math.PI / 180);
    const sin = Math.sin(angle * Math.PI / 180);
    const body = stuck ? P.clipStuck : P.clipBody;
    const shine = stuck ? P.clipStuckShine : P.clipShine;

    // U-shape paper clip: two parallel lines + bottom curve
    g.lineStyle(3, body, 1);
    // Outer loop
    g.strokeRect(x - 5, y - 9, 10, 16);
    // Inner loop
    g.fillStyle(body, 1);
    g.fillRect(x - 2, y - 6, 4, 10);
    // Shine
    g.lineStyle(1, shine, 0.6);
    g.lineBetween(x - 4, y - 8, x - 4, y + 6);
  }

  /* ─────────── MAGNET ─────────── */
  _buildMagnet(W, H) {
    const mW = 260, mH = 52;
    const mx = W * 0.38, my = this._tableY - 60;

    // Build magnet as graphics so we can redraw
    this.magnetGfx = this.add.graphics();
    this._drawMagnet(this.magnetGfx, 0, 0, mW, mH);
    this.magnetGfx.x = mx;
    this.magnetGfx.y = my;
    this.magnetGfx.setDepth(20);

    // Pole labels
    this.labelN = this.add.text(mx - 94, my - 11, "N", {
      fontFamily: "'Georgia', serif", fontSize: "20px",
      color: "#ffffff", fontStyle: "bold"
    }).setDepth(21).setOrigin(0.5);
    this.labelS = this.add.text(mx + 94, my - 11, "S", {
      fontFamily: "'Georgia', serif", fontSize: "20px",
      color: "#ffffff", fontStyle: "bold"
    }).setDepth(21).setOrigin(0.5);
    this.labelMid = this.add.text(mx, my - 10, "middle", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#888880", letterSpacing: 1
    }).setDepth(21).setOrigin(0.5);

    // Invisible hit zone
    this.magnetHit = this.add.rectangle(mx, my, mW + 10, mH + 10, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(22);
    this.input.setDraggable(this.magnetHit);

    // Hover glow
    this.magnetGlow = this.add.graphics().setDepth(19).setAlpha(0);
    this._drawMagnetGlow(this.magnetGlow, mx, my, mW + 24, mH + 24);

    this._magnetMx = mx;
    this._magnetMy = my;
    this._mW = mW;
    this._mH = mH;
  }

  _drawMagnet(g, x, y, w, h) {
    g.clear();
    const hw = w / 2, poleW = 68;

    // Shadow
    g.fillStyle(0x000000, 0.15);
    g.fillRoundedRect(x - hw + 3, y - h/2 + 5, w, h, 14);

    // Middle section
    g.fillStyle(P.magnetMiddle, 1);
    g.fillRoundedRect(x - hw, y - h/2, w, h, 14);
    g.fillStyle(P.magnetMiddleDark, 0.4);
    g.fillRect(x - hw + poleW, y - h/2, w - poleW * 2, h);

    // N-pole (red)
    g.fillStyle(P.magnetRed, 1);
    g.fillRoundedRect(x - hw, y - h/2, poleW, h, { tl: 14, tr: 0, bl: 14, br: 0 });
    g.fillStyle(P.magnetRedDark, 0.3);
    g.fillRoundedRect(x - hw + 2, y + 2, poleW - 4, h/2 - 4, { tl: 0, tr: 0, bl: 12, br: 0 });

    // S-pole (blue)
    g.fillStyle(P.magnetBlue, 1);
    g.fillRoundedRect(x + hw - poleW, y - h/2, poleW, h, { tl: 0, tr: 14, bl: 0, br: 14 });
    g.fillStyle(P.magnetBlueDark, 0.3);
    g.fillRoundedRect(x + hw - poleW + 2, y + 2, poleW - 4, h/2 - 4, { tl: 0, tr: 0, bl: 0, br: 12 });

    // Sheen
    g.fillStyle(P.magnetShine, 0.22);
    g.fillRoundedRect(x - hw + 4, y - h/2 + 4, w - 8, h * 0.3, 10);

    // Border
    g.lineStyle(2.5, 0xffffff, 0.25);
    g.strokeRoundedRect(x - hw, y - h/2, w, h, 14);
  }

  _drawMagnetGlow(g, x, y, w, h) {
    g.clear();
    g.fillStyle(P.magnetRed, 0.08);
    g.fillRoundedRect(x - 60 - w/2, y - h/2, w * 0.45, h, 18);
    g.fillStyle(P.magnetBlue, 0.08);
    g.fillRoundedRect(x + 60 - w/2 * 0.55, y - h/2, w * 0.45, h, 18);
  }

  /* ─────────── FIELD LINES LAYER ─────────── */
  _buildFieldLayer(W, H) {
    this.fieldGfx = this.add.graphics().setDepth(5).setAlpha(0);
  }

  _redrawField(mx, my) {
    const g = this.fieldGfx;
    g.clear();

    const leftX  = mx - 90;
    const rightX = mx + 90;

    // Pole field arcs (simplified visual arcs)
    for (let r = 28; r <= 80; r += 18) {
      g.lineStyle(1.5, P.fieldPole, 0.22 - r * 0.001);
      g.strokeCircle(leftX, my, r);
      g.strokeCircle(rightX, my, r);
    }

    // Middle zone indicator arc
    for (let r = 20; r <= 55; r += 16) {
      g.lineStyle(1.2, P.fieldMid, 0.15 - r * 0.001);
      g.strokeCircle(mx, my, r * 0.6);
    }

    // Zone radius circles (dashed feel via segmented arcs)
    const poleR = 75 * this.poleStrength;
    const midR  = 75 * this.midStrength;

    g.lineStyle(1.5, P.zoneRed, 0.35);
    g.strokeCircle(leftX, my, poleR);
    g.strokeCircle(rightX, my, poleR);

    g.lineStyle(1.5, P.zoneMid, 0.25);
    g.strokeCircle(mx, my, midR);
  }

  /* ─────────── PANEL ─────────── */
  _buildPanel(W, H) {
    const pw = 210, ph = 200;
    const px = W - pw - 18, py = 72;

    const pg = this.add.graphics();
    pg.fillStyle(P.panelBg, 1);
    pg.fillRoundedRect(px, py, pw, ph, 12);
    pg.lineStyle(2, P.panelBorder, 1);
    pg.strokeRoundedRect(px, py, pw, ph, 12);
    // Accent top bar
    pg.fillStyle(P.panelAccent, 1);
    pg.fillRoundedRect(px, py, pw, 6, { tl: 12, tr: 12, bl: 0, br: 0 });

    this.add.text(px + pw/2, py + 20, "CLIP COUNTER", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#c87020", letterSpacing: 3
    }).setOrigin(0.5);

    // LCD
    const lx = px + 14, ly = py + 36, lw = pw - 28, lh = 48;
    const lg = this.add.graphics();
    lg.fillStyle(P.lcdBg, 1);
    lg.fillRoundedRect(lx, ly, lw, lh, 6);
    lg.lineStyle(1.5, 0x1a3020, 1);
    lg.strokeRoundedRect(lx, ly, lw, lh, 6);

    // Ghost digits
    this.add.text(lx + lw/2, ly + lh/2, "00 / 00", {
      fontFamily: "'Courier New', monospace", fontSize: "22px",
      color: "#0d3020", align: "center"
    }).setOrigin(0.5);

    this.lcdMain = this.add.text(lx + lw/2, ly + lh/2, `00 / ${String(this.maxClips).padStart(2, "0")}`, {
      fontFamily: "'Courier New', monospace", fontSize: "22px",
      color: "#44ff88", align: "center"
    }).setOrigin(0.5);

    // Zone readout
    this.add.text(px + pw/2, py + 100, "ACTIVE ZONE", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#c87020", letterSpacing: 2
    }).setOrigin(0.5);

    this.zoneLight = this.add.graphics();
    this.zoneLightText = this.add.text(px + pw/2, py + 122, "—", {
      fontFamily: "'Courier New', monospace", fontSize: "13px",
      color: "#888870", align: "center"
    }).setOrigin(0.5);

    // Rule insight
    this.ruleText = this.add.text(px + pw/2, py + 148, "Pole radius:  strong\nMiddle radius: weak", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#6a4a28", align: "center", lineSpacing: 4
    }).setOrigin(0.5);

    // Reset button
    const bx = px + pw/2, by = py + ph - 20;
    this.btnGfx = this.add.graphics();
    this._drawBtn(this.btnGfx, bx, by, 140, 30, false);

    this.btnTxt = this.add.text(bx, by, "↺  Reset Clips", {
      fontFamily: "'Courier New', monospace", fontSize: "12px",
      color: "#f5e8c8", align: "center"
    }).setOrigin(0.5);

    const btnHit = this.add.rectangle(bx, by, 140, 30, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });

    btnHit.on("pointerover",  () => this._drawBtn(this.btnGfx, bx, by, 140, 30, true));
    btnHit.on("pointerout",   () => this._drawBtn(this.btnGfx, bx, by, 140, 30, false));
    btnHit.on("pointerdown",  () => this._resetClips());
  }

  _drawBtn(g, x, y, w, h, hovered) {
    g.clear();
    g.fillStyle(hovered ? P.btnHover : P.btnBg, 1);
    g.fillRoundedRect(x - w/2, y - h/2, w, h, 6);
    g.lineStyle(1.5, P.btnBorder, hovered ? 1 : 0.6);
    g.strokeRoundedRect(x - w/2, y - h/2, w, h, 6);
  }

  _resetClips() {
    const W = this._W, H = this._H;
    this.clips.forEach((c, i) => {
      c.stuck = false;
      const nx = Phaser.Math.Between(100, W - 100);
      const ny = Phaser.Math.Between(this._tableY + 24, this._tableY + this._tableH - 24);
      c.homeX = nx; c.homeY = ny;
      c.angle = Phaser.Math.Between(-60, 60);

      this.tweens.add({
        targets: c.gfx,
        x: nx, y: ny,
        duration: 300, delay: i * 12,
        ease: "Back.Out",
        onUpdate: () => this._drawClip(c.gfx, 0, 0, c.angle, false)
      });
    });
    this.clipsPicked = 0;
    this._flashLcd();
  }

  _flashLcd() {
    this.tweens.add({
      targets: this.lcdMain, alpha: 0.2, duration: 80,
      yoyo: true, repeat: 3
    });
  }

  /* ─────────── HEADER ─────────── */
  _buildHeader(W, H) {
    const hg = this.add.graphics();
    hg.fillStyle(P.panelBg, 0.92);
    hg.fillRoundedRect(14, 8, W - 248, 56, 10);
    hg.lineStyle(1.5, P.panelBorder, 1);
    hg.strokeRoundedRect(14, 8, W - 248, 56, 10);
    hg.fillStyle(P.panelAccent, 1);
    hg.fillRect(14, 8, 4, 56);

    this.add.text(26, 14, "LAB 07", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#e8a030", letterSpacing: 3
    });
    this.add.text(26, 30, "Magnet Strength", {
      fontFamily: "'Georgia', serif", fontSize: "19px",
      color: "#f5e8c8", fontStyle: "bold"
    });

    this.hintText = this.add.text(26, 52, "Drag the magnet near clips. Poles attract more!", {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: "#a07848"
    });
  }

  /* ─────────── DRAG ─────────── */
  _hookDrag(W, H) {
    this.input.on("dragstart", (p, obj) => {
      this._dragging = true;
      this.tweens.add({ targets: this.magnetGlow, alpha: 1, duration: 200 });
      this.tweens.add({ targets: this.fieldGfx, alpha: 1, duration: 300 });
    });

    this.input.on("drag", (p, obj, x, y) => {
      // Constrain magnet to scene bounds
      const hw = this._mW / 2;
      x = Phaser.Math.Clamp(x, hw + 10, W - hw - 10);
      y = Phaser.Math.Clamp(y, 30, H - 30);

      obj.x = x; obj.y = y;
      this.magnetGfx.x = x; this.magnetGfx.y = y;
      this.labelN.x = x - 94; this.labelN.y = y - 11;
      this.labelS.x = x + 94; this.labelS.y = y - 11;
      this.labelMid.x = x; this.labelMid.y = y - 10;
      this.magnetGlow.x = x - this._magnetMx;
      this.magnetGlow.y = y - this._magnetMy;

      this._magnetMx = x; this._magnetMy = y;
      this._drawMagnetGlow(this.magnetGlow, 0, 0, this._mW + 24, this._mH + 24);
      this._redrawField(x, y);
    });

    this.input.on("dragend", () => {
      this._dragging = false;
      this.tweens.add({ targets: this.magnetGlow, alpha: 0, duration: 400 });
      this.tweens.add({ targets: this.fieldGfx, alpha: 0, duration: 600 });
    });

    // Hover
    this.magnetHit.on("pointerover",  () => this.tweens.add({ targets: this.magnetGlow, alpha: 0.7, duration: 200 }));
    this.magnetHit.on("pointerout",   () => { if (!this._dragging) this.tweens.add({ targets: this.magnetGlow, alpha: 0, duration: 300 }); });
  }

  /* ─────────── UPDATE ─────────── */
  update(time) {
    const mx  = this._magnetMx;
    const my  = this._magnetMy;
    const lx  = mx - 90;
    const rx  = mx + 90;

    let picked = 0;
    let nearestZone = null;
    let nearestDist = Infinity;

    for (const c of this.clips) {
      const dL = Phaser.Math.Distance.Between(c.gfx.x, c.gfx.y, lx, my);
      const dR = Phaser.Math.Distance.Between(c.gfx.x, c.gfx.y, rx, my);
      const dM = Phaser.Math.Distance.Between(c.gfx.x, c.gfx.y, mx, my);

      const nearPole = Math.min(dL, dR);
      const isPole   = nearPole < dM;
      const strength = isPole ? this.poleStrength : this.midStrength;
      const radius   = 75 * strength;
      const dist     = isPole ? nearPole : dM;

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestZone = isPole ? "pole" : "middle";
      }

      if (!c.stuck && dist < radius) {
        c.stuck = true;
        c.stuckAngle = Phaser.Math.Between(-20, 20);
        // Spark effect
        this._spark(c.gfx.x, c.gfx.y);
      }

      if (c.stuck) {
        picked++;
        // Cluster around the attracting pole or middle
        const attachX = isPole ? (dL < dR ? lx : rx) : mx;
        const tx = attachX + c.offsetX === 0
          ? (c.offsetX = Phaser.Math.Between(-38, 38), c.offsetX)
          : c.offsetX;
        const ty = my + this._mH / 2 + 14 + (c.offsetY === 0
          ? (c.offsetY = Phaser.Math.Between(0, 28), c.offsetY)
          : c.offsetY);

        c.gfx.x = Phaser.Math.Linear(c.gfx.x, attachX + c.offsetX, 0.14);
        c.gfx.y = Phaser.Math.Linear(c.gfx.y, my + this._mH / 2 + 10 + c.offsetY, 0.14);
        this._drawClip(c.gfx, 0, 0, c.stuckAngle, true);
      }
    }

    this.clipsPicked = picked;

    // Update LCD
    const padded = String(picked).padStart(2, "0");
    const total  = String(this.maxClips).padStart(2, "0");
    this.lcdMain.setText(`${padded} / ${total}`);

    if (picked > this._prevPicked) this._flashLcd();
    this._prevPicked = picked;

    // Zone indicator
    if (nearestZone === "pole") {
      this.zoneLightText.setText("● POLE  (strong)").setColor("#ff6666");
    } else if (nearestZone === "middle") {
      this.zoneLightText.setText("● MIDDLE (weak)").setColor("#6699ff");
    } else {
      this.zoneLightText.setText("— no clips nearby").setColor("#666650");
    }

    // Hint updates
    if (picked === this.maxClips) {
      this.hintText.setText("All clips collected! Press Reset to try again.");
    } else if (picked > this.maxClips * 0.6) {
      this.hintText.setText(`${picked} clips! The poles are really powerful ⚡`);
    }

    this.emitMeasurement({
      clipsPicked:  this.clipsPicked,
      totalClips:   this.maxClips,
      nearestZone,
      note: "poles stronger than middle"
    });
  }

  /* ─────────── SPARK EFFECT ─────────── */
  _spark(x, y) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dot = this.add.circle(x, y, 3, i % 2 === 0 ? P.sparkYellow : P.sparkOrange, 1).setDepth(30);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * Phaser.Math.Between(18, 36),
        y: y + Math.sin(angle) * Phaser.Math.Between(18, 36),
        alpha: 0, scale: 0,
        duration: Phaser.Math.Between(220, 380),
        ease: "Cubic.Out",
        onComplete: () => dot.destroy()
      });
    }
  }
}