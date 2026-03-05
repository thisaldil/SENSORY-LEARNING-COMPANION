import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════
   PALETTE  –  science-lab: dark teal + amber
═══════════════════════════════════════════════ */
const P = {
  bg:           0x0d1f2d,
  bgMid:        0x112233,
  panel:        0x142a3a,
  panelBorder:  0x1e4060,
  scaleBase:    0x1a3348,
  scalePlatform:0x22495e,
  scalePillar:  0x2a5570,
  lcd:          0x0a1a10,
  lcdGlow:      0x00ff88,
  lcdDim:       0x004433,
  amber:        0xffb347,
  amberGlow:    0xff8c00,
  teal:         0x00c9a7,
  tealDim:      0x005c4e,
  highlight:    0x4dd9c0,
  textBright:   0xe8f4f0,
  textMid:      0x7ab8a8,
  textDim:      0x3a6a5e,
  gridLine:     0x1a3040,
  // Balloon colours per index
  balloon: [0xd0e8ff, 0x80c4ff, 0x2196f3],
  balloonShine:[0xffffff, 0xd4eeff, 0x90caf9],
  balloonKnot: [0xa8c8e8, 0x5a9fd4, 0x1565c0],
  balloonGlow: [0x4fc3f7, 0x039be5, 0x0277bd],
};

/* ═══════════════════════════════════════════════
   SCENE
═══════════════════════════════════════════════ */
export default class L2_AirHasMassScene extends BaseLabScene {
  constructor(opts) {
    super("L2_AirHasMassScene", opts);
    this.balloons = opts.labConfig?.balloons ?? [
      { name: "Empty",     mass: 2,  airPct: 0   },
      { name: "Half Blown",mass: 17, airPct: 0.5 },
      { name: "Full Blown",mass: 32, airPct: 1   },
    ];
    this.selected   = 0;
    this._prevSel   = -1;
    this._displayMass = 0;     // animated counter on LCD
    this._scaleNeedle = 0;     // animated tilt of balance arm
    this._platY     = 0;       // animated platform drop
  }

  /* ──────────────── CREATE ──────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._buildBg(W, H);
    this._buildHeader(W);
    this._buildBalloonPanel(W, H);
    this._buildScale(W, H);
    this._buildInfoStrip(W, H);
    this._hookKeys();

    // initial selection animation
    this._triggerSelect(0, true);
  }

  /* ────────── BACKGROUND ────────── */
  _buildBg(W, H) {
    // Dark gradient sky
    this.add.rectangle(W/2, H/2, W, H, P.bg);

    // Subtle grid
    const g = this.add.graphics();
    g.lineStyle(1, P.gridLine, 0.5);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    // Scan-line vignette strip (decorative top & bottom)
    const vg = this.add.graphics();
    vg.fillGradientStyle(P.bg, P.bg, 0x000000, 0x000000, 1);
    vg.fillRect(0, H - 60, W, 60);

    // Floating dust particles
    this._dust = [];
    for (let i = 0; i < 28; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        Phaser.Math.Between(1, 2),
        P.teal, Phaser.Math.FloatBetween(0.06, 0.22)
      );
      this._dust.push({ dot, speed: Phaser.Math.FloatBetween(0.15, 0.5), phase: Math.random() * Math.PI * 2 });
    }
  }

  /* ────────── HEADER ────────── */
  _buildHeader(W) {
    // Pill badge
    const bg = this.add.graphics();
    bg.fillStyle(P.panel, 1);
    bg.fillRoundedRect(14, 10, W - 28, 54, 12);
    bg.lineStyle(1.5, P.panelBorder, 1);
    bg.strokeRoundedRect(14, 10, W - 28, 54, 12);

    // Accent left bar
    bg.fillStyle(P.teal, 1);
    bg.fillRect(14, 10, 4, 54);

    this.add.text(26, 18, "LAB 02", {
      fontFamily: "'Courier New', monospace",
      fontSize: "11px", color: "#00c9a7", letterSpacing: 3
    });
    this.add.text(26, 35, "Air Has Mass", {
      fontFamily: "'Georgia', serif",
      fontSize: "20px", color: "#e8f4f0", fontStyle: "bold"
    });
    this.add.text(W - 22, 20, "Select a balloon to place on the scale", {
      fontFamily: "'Courier New', monospace",
      fontSize: "12px", color: "#7ab8a8", align: "right"
    }).setOrigin(1, 0);

    // Key hints
    this.add.text(W - 22, 40, "[ 1 ]  [ 2 ]  [ 3 ]  or click", {
      fontFamily: "'Courier New', monospace",
      fontSize: "11px", color: "#3a6a5e", align: "right"
    }).setOrigin(1, 0);
  }

  /* ────────── BALLOON PANEL ────────── */
  _buildBalloonPanel(W, H) {
    const panelX = 30, panelY = 78, panelW = W * 0.52 - 10, panelH = H - 130;

    const pg = this.add.graphics();
    pg.fillStyle(P.panel, 1);
    pg.fillRoundedRect(panelX, panelY, panelW, panelH, 14);
    pg.lineStyle(1.5, P.panelBorder, 1);
    pg.strokeRoundedRect(panelX, panelY, panelW, panelH, 14);

    this.add.text(panelX + 16, panelY + 12, "BALLOONS", {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: "#3a6a5e", letterSpacing: 2
    });

    const cx = [panelX + panelW * 0.2, panelX + panelW * 0.5, panelX + panelW * 0.8];
    const bY  = panelY + panelH * 0.46;

    this._balloonGfx = [];   // graphics objects for redraw
    this._selRings   = [];   // selection ring graphics

    this.balloons.forEach((b, i) => {
      const x = cx[i];
      const radius = 22 + b.airPct * 26;   // visual size proportional to air

      // Selection ring (hidden by default)
      const ring = this.add.graphics();
      ring.lineStyle(2.5, P.teal, 0.7);
      ring.strokeCircle(x, bY, radius + 12);
      ring.setAlpha(0);
      this._selRings.push(ring);

      // Glow halo
      const glow = this.add.circle(x, bY, radius + 16, P.balloonGlow[i], 0);
      this._balloonGfx.push({ glow });

      // Balloon body drawn with graphics for richness
      const bg2 = this.add.graphics();
      this._drawBalloon(bg2, x, bY, radius, i);

      // String
      const str = this.add.graphics();
      str.lineStyle(1.5, P.balloonKnot[i], 0.7);
      str.lineBetween(x, bY + radius, x + Math.sin(i * 1.2) * 6, bY + radius + 38);
      str.lineBetween(x + Math.sin(i * 1.2) * 6, bY + radius + 38, x, bY + radius + 52);

      // Knot dot
      this.add.circle(x, bY + radius + 3, 4, P.balloonKnot[i]);

      // Label card
      const cardG = this.add.graphics();
      cardG.fillStyle(P.scaleBase, 1);
      cardG.fillRoundedRect(x - 52, bY + radius + 56, 104, 42, 8);
      cardG.lineStyle(1.5, P.panelBorder, 1);
      cardG.strokeRoundedRect(x - 52, bY + radius + 56, 104, 42, 8);

      this.add.text(x, bY + radius + 68, b.name, {
        fontFamily: "'Courier New', monospace", fontSize: "12px",
        color: "#e8f4f0", align: "center"
      }).setOrigin(0.5);

      this.add.text(x, bY + radius + 84, `${b.mass} g`, {
        fontFamily: "'Georgia', serif", fontSize: "13px",
        color: "#00c9a7", align: "center", fontStyle: "bold"
      }).setOrigin(0.5);

      // Hit area – invisible interactive circle
      const hit = this.add.circle(x, bY, radius + 14, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on("pointerover",  () => { if (this.selected !== i) glow.setAlpha(0.12); });
      hit.on("pointerout",   () => { if (this.selected !== i) glow.setAlpha(0); });
      hit.on("pointerdown",  () => this._triggerSelect(i));

      // Store refs for animation
      this._balloonGfx[i] = { glow, bg: bg2, str, hit, bY, radius, x };

      // Pop-in intro
      bg2.setScale(0.4).setAlpha(0);
      this.tweens.add({ targets: bg2, scale: 1, alpha: 1, duration: 500 + i * 130, delay: 100, ease: "Back.Out" });
    });
  }

  _drawBalloon(g, x, y, r, idx) {
    // Main body
    g.fillStyle(P.balloon[idx], 1);
    g.fillCircle(x, y, r);
    // Highlight shine
    g.fillStyle(P.balloonShine[idx], 0.55);
    g.fillEllipse(x - r * 0.28, y - r * 0.3, r * 0.5, r * 0.35);
    // Small secondary shine
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(x - r * 0.38, y - r * 0.42, r * 0.11);
  }

  /* ────────── SCALE ────────── */
  _buildScale(W, H) {
    const sx = W * 0.52 + 30;
    const sw = W - sx - 20;
    const panelY = 78, panelH = H - 130;

    // Panel
    const sg = this.add.graphics();
    sg.fillStyle(P.panel, 1);
    sg.fillRoundedRect(sx, panelY, sw, panelH, 14);
    sg.lineStyle(1.5, P.panelBorder, 1);
    sg.strokeRoundedRect(sx, panelY, sw, panelH, 14);

    this.add.text(sx + 16, panelY + 12, "DIGITAL SCALE", {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: "#3a6a5e", letterSpacing: 2
    });

    const scx = sx + sw / 2;  // scale center X

    // ── LCD display ──
    const lcdY = panelY + 36;
    const lcdW = sw - 32, lcdH = 56;
    const lx = sx + 16;
    const lcdG = this.add.graphics();
    lcdG.fillStyle(P.lcd, 1);
    lcdG.fillRoundedRect(lx, lcdY, lcdW, lcdH, 8);
    lcdG.lineStyle(2, P.lcdDim, 1);
    lcdG.strokeRoundedRect(lx, lcdY, lcdW, lcdH, 8);

    // Ghost digits (always visible dim)
    this.add.text(lx + lcdW / 2, lcdY + 13, "888.8 g", {
      fontFamily: "'Courier New', monospace", fontSize: "22px",
      color: "#004433", align: "center"
    }).setOrigin(0.5);

    this.lcdText = this.add.text(lx + lcdW / 2, lcdY + 13, "0.0 g", {
      fontFamily: "'Courier New', monospace", fontSize: "22px",
      color: "#00ff88", align: "center"
    }).setOrigin(0.5);

    // LCD glow overlay
    const glowG = this.add.graphics();
    glowG.fillStyle(P.lcdGlow, 0.04);
    glowG.fillRoundedRect(lx, lcdY, lcdW, lcdH, 8);

    // ── Scale body ──
    const baseY = panelY + panelH - 30;
    const pillarH = panelH * 0.38;
    const pillarW = 18;

    // Base plate
    const baseG = this.add.graphics();
    baseG.fillStyle(P.scaleBase, 1);
    baseG.fillRoundedRect(scx - 70, baseY - 12, 140, 24, 6);
    baseG.lineStyle(2, P.scalePillar, 1);
    baseG.strokeRoundedRect(scx - 70, baseY - 12, 140, 24, 6);

    // Pillar
    baseG.fillStyle(P.scalePillar, 1);
    baseG.fillRect(scx - pillarW / 2, baseY - pillarH - 12, pillarW, pillarH);
    baseG.lineStyle(1, P.panelBorder, 0.5);
    baseG.strokeRect(scx - pillarW / 2, baseY - pillarH - 12, pillarW, pillarH);

    // Pivot circle
    this.add.circle(scx, baseY - pillarH - 12, 9, P.teal, 1);
    this.add.circle(scx, baseY - pillarH - 12, 5, P.bg, 1);

    // ── Balance arm (rotates on selection) ──
    this._armY = baseY - pillarH - 12;
    this._armCX = scx;
    this._armAngle = 0;

    this.armGfx = this.add.graphics();
    this._drawArm(0);

    // ── Platform + placed balloon ──
    const platW = sw * 0.56;
    const platH = 14;
    this._platBaseY = this._armY - 4;
    this._platY = 0;   // offset driven by animation

    this.platGfx = this.add.graphics();
    this._drawPlatform(platW, platH, scx, this._platBaseY, 0);

    // Balloon on scale
    this._scaleBalloonGfx = this.add.graphics();
    this._scaleBalloonLabel = this.add.text(scx, this._platBaseY - 60, "", {
      fontFamily: "'Courier New', monospace", fontSize: "12px",
      color: "#e8f4f0", align: "center"
    }).setOrigin(0.5).setAlpha(0);

    this._scalePlacedIdx = -1;
  }

  _drawArm(angle) {
    this.armGfx.clear();
    const len = 90;
    const ax = this._armCX;
    const ay = this._armY;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Arm beam
    this.armGfx.lineStyle(8, P.scalePlatform, 1);
    this.armGfx.lineBetween(ax - len * cos, ay - len * sin, ax + len * cos, ay + len * sin);
    this.armGfx.lineStyle(8, P.highlight, 0.15);
    this.armGfx.lineBetween(ax - len * cos, ay - len * sin - 2, ax + len * cos, ay + len * sin - 2);

    // End connectors
    [[-1], [1]].forEach(([dir]) => {
      this.armGfx.fillStyle(P.teal, 1);
      this.armGfx.fillCircle(ax + dir * len * cos, ay + dir * len * sin, 6);
    });
  }

  _drawPlatform(w, h, cx, baseY, dyOffset) {
    this.platGfx.clear();
    const py = baseY - 10 + dyOffset;
    this.platGfx.fillStyle(P.scalePlatform, 1);
    this.platGfx.fillRoundedRect(cx - w / 2, py, w, h, 4);
    this.platGfx.lineStyle(2, P.highlight, 0.35);
    this.platGfx.strokeRoundedRect(cx - w / 2, py, w, h, 4);
    // Sheen
    this.platGfx.fillStyle(0xffffff, 0.08);
    this.platGfx.fillRoundedRect(cx - w / 2 + 6, py + 2, w - 12, 4, 2);
  }

  /* ────────── INFO STRIP ────────── */
  _buildInfoStrip(W, H) {
    const sy = H - 44;
    const sg = this.add.graphics();
    sg.fillStyle(P.panel, 1);
    sg.fillRoundedRect(14, sy, W - 28, 34, 8);
    sg.lineStyle(1, P.panelBorder, 1);
    sg.strokeRoundedRect(14, sy, W - 28, 34, 8);

    this.infoText = this.add.text(W / 2, sy + 17, "⬆  Click a balloon or press 1, 2, 3 to place it on the scale", {
      fontFamily: "'Courier New', monospace", fontSize: "12px",
      color: "#7ab8a8", align: "center"
    }).setOrigin(0.5);
  }

  /* ────────── KEYS ────────── */
  _hookKeys() {
    this.input.keyboard.on("keydown-ONE",   () => this._triggerSelect(0));
    this.input.keyboard.on("keydown-TWO",   () => this._triggerSelect(1));
    this.input.keyboard.on("keydown-THREE", () => this._triggerSelect(2));
  }

  /* ────────── SELECTION LOGIC ────────── */
  _triggerSelect(idx, instant = false) {
    if (this.selected === idx && !instant) return;
    this.selected = idx;

    const b = this.balloons[idx];

    // Update selection rings
    this._selRings.forEach((r, i) => {
      this.tweens.add({ targets: r, alpha: i === idx ? 0.85 : 0, duration: 200 });
    });

    // Glow on selected
    this._balloonGfx.forEach((bg, i) => {
      this.tweens.add({ targets: bg.glow, alpha: i === idx ? 0.28 : 0, duration: 220 });
    });

    // Animate LCD counter from current to target
    const startMass = this._displayMass;
    const endMass   = b.mass;
    const dur       = instant ? 0 : 600;
    this.tweens.addCounter({
      from: startMass, to: endMass, duration: dur, ease: "Cubic.Out",
      onUpdate: (tw) => {
        this._displayMass = tw.getValue();
        this.lcdText.setText(`${this._displayMass.toFixed(1)} g`);
      }
    });

    // Animate arm tilt: heavier = more tilt (max 0.18 rad)
    const maxMass   = Math.max(...this.balloons.map(b => b.mass));
    const targetTilt = (b.mass / maxMass) * 0.18;
    const startTilt  = this._armAngle;
    this.tweens.addCounter({
      from: startTilt, to: targetTilt, duration: instant ? 0 : 700, ease: "Elastic.Out",
      onUpdate: (tw) => {
        this._armAngle = tw.getValue();
        this._drawArm(this._armAngle);
      }
    });

    // Platform drop proportional to mass
    const targetDrop = (b.mass / maxMass) * 14;
    const W = this.scale.width;
    const sw = W - (W * 0.52 + 30) - 20;
    const scx = W * 0.52 + 30 + sw / 2;
    const platW = sw * 0.56;
    this.tweens.addCounter({
      from: this._platY, to: targetDrop, duration: instant ? 0 : 600, ease: "Bounce.Out",
      onUpdate: (tw) => {
        this._platY = tw.getValue();
        this._drawPlatform(platW, 14, scx, this._platBaseY, this._platY);
        // Move placed balloon with platform
        this._redrawScaleBalloon(idx, scx, this._platBaseY + this._platY);
      }
    });

    // Flash LCD
    if (!instant) {
      this.tweens.add({ targets: this.lcdText, alpha: 0.3, duration: 80, yoyo: true, repeat: 2 });
    }

    // Info text
    this.infoText.setText(
      `Balloon: "${b.name}"  ·  Mass: ${b.mass} g  ·  ${this._massInsight(idx)}`
    );

    this.emitMeasurement({ balloon: b.name, mass: b.mass });
  }

  _redrawScaleBalloon(idx, scx, platTopY) {
    const b = this.balloons[idx];
    const radius = 14 + b.airPct * 18;
    const bY = platTopY - radius - 8;

    this._scaleBalloonGfx.clear();
    this._drawBalloon(this._scaleBalloonGfx, scx, bY, radius, idx);

    // String
    this._scaleBalloonGfx.lineStyle(1.5, P.balloonKnot[idx], 0.7);
    this._scaleBalloonGfx.lineBetween(scx, bY + radius, scx, platTopY - 2);
    this._scaleBalloonGfx.fillStyle(P.balloonKnot[idx], 1);
    this._scaleBalloonGfx.fillCircle(scx, bY + radius + 2, 3);

    this._scaleBalloonLabel
      .setPosition(scx, bY - radius - 10)
      .setText(b.name)
      .setAlpha(1);
  }

  _massInsight(idx) {
    const insights = [
      "No air inside — just the rubber shell.",
      "Half filled — air adds real mass!",
      "Fully inflated — maximum air mass.",
    ];
    return insights[idx] ?? "";
  }

  /* ────────── UPDATE ────────── */
  update(time) {
    // Animate dust
    this._dust.forEach(({ dot, speed, phase }) => {
      dot.y -= speed * 0.4;
      dot.x += Math.sin(time * 0.0008 + phase) * 0.25;
      if (dot.y < -4) { dot.y = this.scale.height + 4; dot.x = Phaser.Math.Between(0, this.scale.width); }
    });

    // Balloon bob in panel
    this._balloonGfx.forEach(({ bg, x, bY }, i) => {
      const bob = Math.sin(time / 900 + i * 1.3) * 3;
      bg.y = bob;
    });

    // Pulse selection ring
    const pulse = 0.6 + Math.sin(time / 300) * 0.4;
    this._selRings[this.selected]?.setAlpha(pulse * 0.85);
  }
}