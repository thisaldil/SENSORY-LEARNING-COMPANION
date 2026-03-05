import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════════
   PALETTE  –  chemistry / marine science lab
═══════════════════════════════════════════════════ */
const P = {
  // Background
  bg:             0x0a1018,
  bgMid:          0x0e1520,
  gridLine:       0x101820,

  // Lab bench
  benchTop:       0x1a2530,
  benchEdge:      0x0f1820,
  benchSurface:   0x141e28,
  benchLeg:       0x0c1218,

  // Beaker
  glassBody:      0xc8e8f8,
  glassStroke:    0x90c0e0,
  glassSheen:     0xffffff,
  glassMark:      0x6090b0,
  beakerBase:     0xa0c8e0,

  // Water tints (salinity gradient)
  water0:         0x4488dd,   // fresh – clear blue
  water3:         0x2266bb,   // light saline
  water6:         0x115599,   // medium saline
  water10:        0x003377,   // heavy brine – deep navy

  // Salt
  saltCrystal:    0xeef4ff,
  saltSheen:      0xffffff,
  saltGrain:      0xccddee,

  // Scale / balance
  scaleBody:      0x1e2e40,
  scalePlatform:  0x2a3e54,
  scalePlatEdge:  0x3a5470,
  scaleDisplay:   0x040810,
  scaleAccent:    0x00aaff,
  scaleOn:        0x00ddff,
  scaleDim:       0x042030,
  scaleLed:       0x00ff88,

  // Panel
  panelBg:        0x06080f,
  panelBorder:    0x1a2a3a,
  panelAccent:    0x00aaff,
  lcdBg:          0x030508,
  lcdOn:          0x00ddff,
  lcdDim:         0x042030,

  // Beaker selector badges
  sel1:           0x44aaff,
  sel2:           0x44ffaa,
  sel3:           0xffcc44,

  // Chart
  chartBg:        0x030508,
  chartGrid:      0x081020,
  bar1:           0x44aaff,
  bar2:           0x44ffaa,
  bar3:           0xffcc44,

  // Bubbles
  bubble:         0xaaddff,

  // Text
  textBright:     0xd0eeff,
  textMid:        0x5a88aa,
  textDim:        0x1a3a5a,
};

const BEAKER_COLORS = [P.sel1, P.sel2, P.sel3];

export default class L3_SalinityMassScene extends BaseLabScene {
  constructor(opts) {
    super("L3_SalinityMassScene", opts);
    this.volumeMl  = opts.labConfig?.volumeMl  ?? 25;
    this.baseMass  = opts.labConfig?.baseMass  ?? 25;
    this.saltFactor= opts.labConfig?.saltFactor ?? 1.0;
    this.maxSalt   = opts.labConfig?.maxSalt   ?? 10;

    this.selected  = 1;
    this.salts     = { 1: 0, 2: 2, 3: 6 };

    this._displayMass = { 1: this._massFor(1), 2: this._massFor(2), 3: this._massFor(3) };
    this._bubbles  = [];
    this._crystals = [];   // static salt crystals per beaker
    this._scaleAnim = 0;   // lerp target for scale display
    this._scaleDisplay = 0;
  }

  /* ──────────────────────── CREATE ──────────────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._W = W; this._H = H;

    this._buildBackground(W, H);
    this._buildBench(W, H);
    this._buildBeakers(W, H);
    this._buildScale(W, H);
    this._buildPanel(W, H);
    this._buildMassChart(W, H);
    this._buildHeader(W, H);
    this._hookKeys();

    // Intro pop-in
    this._beakerGroups.forEach((bg, i) => {
      [bg.glassGfx, bg.waterGfx, bg.saltGfx, bg.bubbleGfx, bg.labelTxt, bg.saltTxt, bg.saltAmtTxt, bg.plusBtn, bg.minusBtn].forEach(o => {
        if (!o) return;
        o.setAlpha(0);
        this.tweens.add({ targets: o, alpha: 1, duration: 380, delay: 80 + i * 120, ease: "Sine.Out" });
      });
    });
  }

  /* ─────────── BACKGROUND ─────────── */
  _buildBackground(W, H) {
    this.add.rectangle(W/2, H/2, W, H, P.bg);
    const g = this.add.graphics();
    g.fillStyle(P.gridLine, 0.7);
    for (let x = 0; x <= W; x += 32)
      for (let y = 0; y <= H; y += 32)
        g.fillRect(x, y, 1, 1);

    const v = this.add.graphics();
    v.fillStyle(0x000000, 0.5);
    v.fillRect(0, 0, W, 22);
    v.fillRect(0, H - 22, W, 22);
    v.fillRect(0, 0, 22, H);
    v.fillRect(W - 22, 0, 22, H);
  }

  /* ─────────── BENCH ─────────── */
  _buildBench(W, H) {
    const by = H * 0.72;
    this._benchY = by;

    const g = this.add.graphics().setDepth(2);
    // Bench top surface
    g.fillStyle(P.benchTop, 1);
    g.fillRoundedRect(28, by - 10, W - 56, 22, 4);
    g.lineStyle(1.5, P.benchEdge, 1);
    g.strokeRoundedRect(28, by - 10, W - 56, 22, 4);
    g.fillStyle(0xffffff, 0.04);
    g.fillRoundedRect(28, by - 10, W - 56, 6, 4);
    // Groove
    g.fillStyle(P.benchSurface, 1);
    g.fillRoundedRect(44, by - 3, W - 88, 9, 2);
    // Legs
    g.fillStyle(P.benchLeg, 1);
    [[80, by + 12], [W - 80, by + 12]].forEach(([lx, ly]) => {
      g.fillRect(lx - 8, ly, 16, H - ly - 10);
    });
  }

  /* ─────────── BEAKERS ─────────── */
  _buildBeakers(W, H) {
    const by = this._benchY;
    const positions = [W * 0.17, W * 0.42, W * 0.67];
    this._beakerGroups = [];
    this._beakerX = positions;

    positions.forEach((bx, i) => {
      const id = i + 1;
      const g = this._buildSingleBeaker(bx, by - 10, id);
      this._beakerGroups.push(g);
    });
  }

  _buildSingleBeaker(cx, baseY, id) {
    const bw = 88, bh = 130;
    const waterMaxH = bh - 24;
    const beakerTopY = baseY - bh;

    // ── Glass body (drawn each frame for water) ──
    const glassGfx = this.add.graphics().setDepth(6);
    const waterGfx = this.add.graphics().setDepth(5);
    const saltGfx  = this.add.graphics().setDepth(7);
    const bubbleGfx= this.add.graphics().setDepth(8);

    this._drawGlass(glassGfx, cx, baseY, bw, bh, id, false);

    // Label at bottom
    const badgeColor = BEAKER_COLORS[id - 1];
    const labelTxt = this.add.text(cx, baseY + 16, `BEAKER  ${id}`, {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${badgeColor.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5, 0).setDepth(9);

    // Salt amount above beaker
    const saltTxt = this.add.text(cx, beakerTopY - 32, "SALT", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(9);

    const saltAmtTxt = this.add.text(cx, beakerTopY - 18, "0.0 g", {
      fontFamily: "'Georgia', serif", fontSize: "16px",
      color: `#${P.lcdOn.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setOrigin(0.5).setDepth(9);

    // +/- buttons
    const btnY = baseY + 38;
    const plusBtn  = this._makeBtn(cx + 22, btnY, "+", badgeColor, () => this._addSalt(id,  0.5));
    const minusBtn = this._makeBtn(cx - 22, btnY, "−", badgeColor, () => this._addSalt(id, -0.5));

    // Click to select
    const hitZone = this.add.rectangle(cx, beakerTopY + bh/2, bw + 20, bh + 40, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    hitZone.on("pointerdown", () => this._selectBeaker(id));
    hitZone.on("pointerover",  () => { if (this.selected !== id) this._drawGlass(glassGfx, cx, baseY, bw, bh, id, true); });
    hitZone.on("pointerout",   () => { this._drawGlass(glassGfx, cx, baseY, bw, bh, id, this.selected === id); });

    return {
      id, cx, baseY, bw, bh, beakerTopY, waterMaxH,
      glassGfx, waterGfx, saltGfx, bubbleGfx,
      labelTxt, saltTxt, saltAmtTxt,
      plusBtn: plusBtn.gfx, minusBtn: minusBtn.gfx,
      _plusHit: plusBtn.hit, _minusHit: minusBtn.hit,
      _bubbles: [],
    };
  }

  _makeBtn(x, y, label, color, cb) {
    const gfx = this.add.graphics().setDepth(11);
    gfx.fillStyle(P.panelBg, 1);
    gfx.fillRoundedRect(x - 14, y - 12, 28, 24, 5);
    gfx.lineStyle(1.5, color, 0.7);
    gfx.strokeRoundedRect(x - 14, y - 12, 28, 24, 5);
    this.add.text(x, y, label, {
      fontFamily: "'Georgia', serif", fontSize: "16px",
      color: `#${color.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setOrigin(0.5).setDepth(12);

    const hit = this.add.rectangle(x, y, 32, 28, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true }).setDepth(13);
    hit.on("pointerover",  () => { gfx.clear(); gfx.fillStyle(color, 0.2); gfx.fillRoundedRect(x - 14, y - 12, 28, 24, 5); gfx.lineStyle(1.5, color, 1); gfx.strokeRoundedRect(x - 14, y - 12, 28, 24, 5); });
    hit.on("pointerout",   () => { gfx.clear(); gfx.fillStyle(P.panelBg, 1); gfx.fillRoundedRect(x - 14, y - 12, 28, 24, 5); gfx.lineStyle(1.5, color, 0.7); gfx.strokeRoundedRect(x - 14, y - 12, 28, 24, 5); });
    hit.on("pointerdown", cb);
    return { gfx, hit };
  }

  _drawGlass(g, cx, baseY, bw, bh, id, hover) {
    g.clear();
    const tx = cx - bw/2, ty = baseY - bh;
    const selected = this.selected === id;
    const borderCol = selected ? BEAKER_COLORS[id-1] : hover ? P.glassStroke : P.glassMark;
    const borderW   = selected ? 2.5 : 1.5;

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(tx + 4, ty + 4, bw, bh, { tl: 2, tr: 2, bl: 6, br: 6 });

    // Tapered glass body (trapezoid approximated with two triangles + rect)
    const topW = bw + 8, botW = bw;
    g.fillStyle(P.glassBody, 0.12);
    g.fillRect(cx - botW/2, ty, botW, bh);
    // Slanted sides using lines
    g.lineStyle(borderW, borderCol, 1);
    g.lineBetween(cx - topW/2, ty, cx - botW/2, ty + bh);
    g.lineBetween(cx + topW/2, ty, cx + botW/2, ty + bh);
    g.lineBetween(cx - botW/2, ty + bh, cx + botW/2, ty + bh);
    // Rim
    g.lineStyle(borderW + 1, borderCol, 0.8);
    g.lineBetween(cx - topW/2 - 6, ty, cx + topW/2 + 6, ty);
    // Pour spout notch
    g.lineStyle(borderW, borderCol, 0.6);
    g.lineBetween(cx + topW/2 + 2, ty, cx + topW/2 + 14, ty - 10);

    // Volume marks (3 lines)
    g.lineStyle(1, P.glassMark, 0.45);
    for (let m = 1; m <= 3; m++) {
      const my = ty + bh - m * (bh / 4);
      g.lineBetween(cx + botW/2 - 8, my, cx + botW/2 - 2, my);
    }

    // Left sheen strip
    g.lineStyle(3, P.glassSheen, 0.18);
    g.lineBetween(cx - topW/2 + 5, ty + 8, cx - botW/2 + 4, ty + bh - 12);

    // Selection glow
    if (selected) {
      g.lineStyle(8, BEAKER_COLORS[id-1], 0.1);
      g.lineBetween(cx - topW/2 - 6, ty, cx - botW/2, ty + bh);
      g.lineBetween(cx + topW/2 + 6, ty, cx + botW/2, ty + bh);
    }
  }

  _redrawWater(bg, salt, cx, baseY, bw, bh) {
    bg.clear();
    const maxH = bh - 24;
    const fillFraction = 0.62 + (salt / this.maxSalt) * 0.12;
    const fillH = maxH * fillFraction;
    const ty = baseY - bh;
    const fillY = ty + (bh - fillH) - 4;

    // Water colour based on salinity
    const pct = salt / this.maxSalt;
    const wColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x44, g: 0x88, b: 0xdd },
      { r: 0x00, g: 0x33, b: 0x77 },
      100, Math.round(pct * 100)
    );
    const col = Phaser.Display.Color.GetColor(wColor.r, wColor.g, wColor.b);

    // Water body
    bg.fillStyle(col, 0.55 + pct * 0.25);
    bg.fillRect(cx - bw/2 + 2, fillY, bw - 4, fillH);

    // Surface shimmer
    bg.fillStyle(0xffffff, 0.14);
    bg.fillRect(cx - bw/2 + 4, fillY + 2, (bw - 10) * 0.55, 5);

    // Salinity colour band at surface
    if (salt > 0.5) {
      bg.fillStyle(col, 0.3);
      bg.fillRect(cx - bw/2 + 2, fillY, bw - 4, 10);
    }
  }

  _redrawSalt(sg, salt, cx, baseY, bw, bh) {
    sg.clear();
    if (salt < 0.1) return;
    const ty = baseY - bh;
    const fillY = ty + bh - 28;
    const crystalCount = Math.min(Math.round(salt * 4), 40);

    // Salt layer at bottom
    sg.fillStyle(P.saltCrystal, 0.5);
    sg.fillRect(cx - bw/2 + 4, fillY + 12, bw - 8, Math.min(8, salt * 1.2));

    // Individual crystals
    for (let i = 0; i < crystalCount; i++) {
      const seed = (i * 137 + salt * 10) % 1;
      const kx = cx - bw/2 + 8 + ((i * 47) % (bw - 16));
      const ky = fillY + 4 + ((i * 31) % 14);
      const kr = 1.5 + (i % 3) * 0.8;
      sg.fillStyle(P.saltCrystal, 0.6 + (i % 3) * 0.13);
      sg.fillRect(kx - kr, ky - kr, kr * 2, kr * 2);
      if (i % 4 === 0) {
        sg.fillStyle(P.saltSheen, 0.4);
        sg.fillRect(kx - 0.5, ky - 0.5, 1, 1);
      }
    }
  }

  _tickBubbles(bg, salt, cx, baseY, bw, bh, dt, beakerBubbles) {
    bg.clear();
    if (salt < 0.5) return;

    const ty = baseY - bh;
    const maxH = bh - 24;
    const fillFraction = 0.62 + (salt / this.maxSalt) * 0.12;
    const fillH = maxH * fillFraction;
    const fillY = ty + (bh - fillH) - 4;

    // Spawn
    if (Math.random() < 0.06 * (salt / this.maxSalt)) {
      beakerBubbles.push({
        x: cx - bw/2 + 8 + Math.random() * (bw - 16),
        y: fillY + fillH - 10,
        r: Phaser.Math.FloatBetween(1.5, 3.5),
        speed: Phaser.Math.FloatBetween(12, 28),
        alpha: 0.45,
      });
    }

    beakerBubbles.splice(0, beakerBubbles.length,
      ...beakerBubbles.filter(b => {
        b.y -= b.speed * dt;
        b.alpha -= 0.6 * dt;
        if (b.y < fillY + 4 || b.alpha <= 0) return false;
        bg.lineStyle(1, P.bubble, b.alpha);
        bg.strokeCircle(b.x, b.y, b.r);
        return true;
      })
    );
  }

  /* ─────────── DIGITAL SCALE ─────────── */
  _buildScale(W, H) {
    const sx = W * 0.84, sy = this._benchY - 60;
    const sw = 140, sh = 110;
    this._scaleCX = sx; this._scaleCY = sy;
    this._scaleW  = sw; this._scaleH  = sh;

    const g = this.add.graphics().setDepth(6);

    // Base platform shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(sx - sw/2 + 3, sy + 30 + 4, sw, 28, 6);

    // Base platform
    g.fillStyle(P.scaleBody, 1);
    g.fillRoundedRect(sx - sw/2, sy + 30, sw, 28, 6);
    g.lineStyle(1.5, P.scalePlatEdge, 0.7);
    g.strokeRoundedRect(sx - sw/2, sy + 30, sw, 28, 6);

    // Display housing
    g.fillStyle(P.scaleBody, 1);
    g.fillRoundedRect(sx - sw/2, sy - sh/2, sw, sh * 0.65, 8);
    g.lineStyle(1.5, P.scalePlatEdge, 0.6);
    g.strokeRoundedRect(sx - sw/2, sy - sh/2, sw, sh * 0.65, 8);
    g.fillStyle(P.scaleAccent, 1);
    g.fillRoundedRect(sx - sw/2, sy - sh/2, sw, 4, { tl: 8, tr: 8, bl: 0, br: 0 });

    // LCD screen
    const lcdW = sw - 20, lcdH = 36;
    g.fillStyle(P.scaleDisplay, 1);
    g.fillRoundedRect(sx - lcdW/2, sy - sh/2 + 12, lcdW, lcdH, 5);
    g.lineStyle(1, P.scalePlatEdge, 0.5);
    g.strokeRoundedRect(sx - lcdW/2, sy - sh/2 + 12, lcdW, lcdH, 5);

    // Ghost digits
    this.add.text(sx + lcdW/2 - 8, sy - sh/2 + 12 + lcdH/2, "000.0 g", {
      fontFamily: "'Courier New', monospace", fontSize: "14px",
      color: `#${P.scaleDim.toString(16).padStart(6,"0")}`
    }).setOrigin(1, 0.5).setDepth(7);

    // Live weight display
    this.scaleDisplayTxt = this.add.text(sx + lcdW/2 - 8, sy - sh/2 + 12 + lcdH/2, "—", {
      fontFamily: "'Courier New', monospace", fontSize: "15px",
      color: `#${P.scaleOn.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setOrigin(1, 0.5).setDepth(8);

    // LED indicator
    this.scaleLed = this.add.circle(sx - lcdW/2 + 8, sy - sh/2 + 30, 4, P.scaleLed, 1).setDepth(8);

    // "g" unit label
    this.add.text(sx, sy - sh/2 + 54, "DIGITAL SCALE", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(8);

    // Weighing platform top
    this.scalePlatGfx = this.add.graphics().setDepth(9);
    this._redrawScalePlatform(false);
  }

  _redrawScalePlatform(active) {
    const g = this.scalePlatGfx;
    g.clear();
    const { _scaleCX: sx, _scaleCY: sy, _scaleW: sw } = this;
    const platW = sw - 10;

    g.fillStyle(0x000000, 0.2);
    g.fillRoundedRect(sx - platW/2 + 2, sy + 8 + 2, platW, 20, 5);
    g.fillStyle(active ? P.scalePlatform : P.scaleBody, 1);
    g.fillRoundedRect(sx - platW/2, sy + 8, platW, 20, 5);
    g.lineStyle(2, active ? P.scaleAccent : P.scalePlatEdge, active ? 0.8 : 0.5);
    g.strokeRoundedRect(sx - platW/2, sy + 8, platW, 20, 5);
    g.fillStyle(0xffffff, 0.07);
    g.fillRoundedRect(sx - platW/2 + 4, sy + 10, platW - 8, 6, 3);
  }

  /* ─────────── READOUT PANEL ─────────── */
  _buildPanel(W, H) {
    const px = 14, py = 70;
    const pw = W * 0.14, ph = H * 0.54;

    this._panelX = px; this._panelY = py;
    this._panelW = pw; this._panelH = ph;

    const pg = this.add.graphics().setDepth(10);
    pg.fillStyle(0x000000, 0.35);
    pg.fillRoundedRect(px + 3, py + 5, pw, ph, 10);
    pg.fillStyle(P.panelBg, 1);
    pg.fillRoundedRect(px, py, pw, ph, 10);
    pg.lineStyle(1.5, P.panelBorder, 1);
    pg.strokeRoundedRect(px, py, pw, ph, 10);
    pg.fillStyle(P.panelAccent, 1);
    pg.fillRoundedRect(px, py, pw, 4, { tl: 10, tr: 10, bl: 0, br: 0 });

    const cx = px + pw/2;
    this.add.text(cx, py + 14, "LAB DATA", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(11);

    const lcdRow = (label, yy) => {
      const lh = 26, lx = px + 6, lw = pw - 12;
      const lg = this.add.graphics().setDepth(11);
      lg.fillStyle(P.lcdBg, 1);
      lg.fillRoundedRect(lx, yy, lw, lh, 4);
      lg.lineStyle(1, P.panelBorder, 0.7);
      lg.strokeRoundedRect(lx, yy, lw, lh, 4);
      this.add.text(lx + 4, yy + 4, label, {
        fontFamily: "'Courier New', monospace", fontSize: "7px",
        color: `#${P.lcdDim.toString(16).padStart(6,"0")}`, letterSpacing: 1
      }).setDepth(12);
      return this.add.text(lx + lw - 4, yy + lh/2, "—", {
        fontFamily: "'Courier New', monospace", fontSize: "11px",
        color: `#${P.lcdOn.toString(16).padStart(6,"0")}`
      }).setOrigin(1, 0.5).setDepth(13);
    };

    let ry = py + 28;
    this._lcdBeaker = lcdRow("BEAKER",    ry); ry += 32;
    this._lcdSalt   = lcdRow("SALT (g)",  ry); ry += 32;
    this._lcdMass   = lcdRow("MASS (g)",  ry); ry += 32;
    this._lcdVol    = lcdRow("VOL (mL)",  ry); ry += 32;
    this._lcdSalin  = lcdRow("SALINITY",  ry); ry += 36;

    // Comparison mini note
    this.compNote = this.add.text(cx, ry + 4, "", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.textMid.toString(16).padStart(6,"0")}`, align: "center",
      wordWrap: { width: pw - 12 }
    }).setOrigin(0.5, 0).setDepth(12);
  }

  /* ─────────── MASS COMPARISON CHART ─────────── */
  _buildMassChart(W, H) {
    const gx = W * 0.84 - 70, gy = H * 0.72 - 10;
    const gw = 148, gh = H - gy - 20;
    this._chartX = gx; this._chartY = gy;
    this._chartW = gw; this._chartH = gh;

    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(P.chartBg, 1);
    bg.fillRoundedRect(gx, gy, gw, gh, 8);
    bg.lineStyle(1.5, P.panelBorder, 1);
    bg.strokeRoundedRect(gx, gy, gw, gh, 8);
    bg.fillStyle(P.panelAccent, 1);
    bg.fillRoundedRect(gx, gy, gw, 4, { tl: 8, tr: 8, bl: 0, br: 0 });
    bg.lineStyle(1, P.chartGrid, 1);
    for (let i = 1; i < 4; i++) bg.lineBetween(gx + 8, gy + (gh/4)*i, gx + gw - 8, gy + (gh/4)*i);

    this.add.text(gx + gw/2, gy + 12, "MASS COMPARE", {
      fontFamily: "'Courier New', monospace", fontSize: "7px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(11);

    this.chartGfx = this.add.graphics().setDepth(11);
  }

  _drawMassChart() {
    const g = this.chartGfx;
    g.clear();
    const { _chartX: gx, _chartY: gy, _chartW: gw, _chartH: gh } = this;
    const pad = 14, barPad = 6;
    const n = 3, barW = (gw - pad * 2 - barPad * (n - 1)) / n;

    const maxM = Math.max(...[1,2,3].map(id => this._massFor(id))) + 2;
    const cols = [P.bar1, P.bar2, P.bar3];

    [1,2,3].forEach((id, i) => {
      const m = this._displayMass[id] ?? this._massFor(id);
      const bx = gx + pad + i * (barW + barPad);
      const barH = Math.max(4, (m / maxM) * (gh - pad * 2 - 18));
      const by   = gy + gh - pad - barH;
      const isSel = this.selected === id;

      g.fillStyle(cols[i], isSel ? 0.9 : 0.45);
      g.fillRoundedRect(bx, by, barW, barH, 3);
      g.fillStyle(0xffffff, isSel ? 0.2 : 0.08);
      g.fillRoundedRect(bx + 2, by + 2, barW - 4, Math.min(6, barH - 4), 2);

      // Mass label above bar
      this.chartGfx.fillStyle(cols[i], isSel ? 0.9 : 0.5);
      this.add.text; // skip dynamic text in chart (handled by LCD)
    });
  }

  /* ─────────── HEADER ─────────── */
  _buildHeader(W, H) {
    const hg = this.add.graphics().setDepth(20);
    const hx = W * 0.14 + 24, hw = W - hx - 160;
    hg.fillStyle(P.panelBg, 0.92);
    hg.fillRoundedRect(hx, 6, hw, 56, 8);
    hg.lineStyle(1.5, P.panelBorder, 1);
    hg.strokeRoundedRect(hx, 6, hw, 56, 8);
    hg.fillStyle(P.panelAccent, 1);
    hg.fillRect(hx, 6, 4, 56);

    this.add.text(hx + 14, 12, "LAB 03", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 3
    }).setDepth(21);
    this.add.text(hx + 14, 28, "Salinity vs Mass", {
      fontFamily: "'Georgia', serif", fontSize: "19px",
      color: `#${P.textBright.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setDepth(21);

    this._hintTxt = this.add.text(hx + 14, 52,
      "Click a beaker or press 1/2/3 to select  ·  Use +/− or ↑/↓ to add salt", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`
    }).setDepth(21);
  }

  /* ─────────── KEYS ─────────── */
  _hookKeys() {
    const kb = this.input.keyboard;
    kb.on("keydown-ONE",   () => this._selectBeaker(1));
    kb.on("keydown-TWO",   () => this._selectBeaker(2));
    kb.on("keydown-THREE", () => this._selectBeaker(3));
    kb.on("keydown-UP",    () => this._addSalt(this.selected,  0.5));
    kb.on("keydown-DOWN",  () => this._addSalt(this.selected, -0.5));
  }

  /* ─────────── HELPERS ─────────── */
  _massFor(id) {
    const salt = this.salts[id] ?? 0;
    return this.baseMass + this.volumeMl + salt * this.saltFactor;
  }

  _selectBeaker(id) {
    const prev = this.selected;
    this.selected = id;

    this._beakerGroups.forEach(bg => {
      this._drawGlass(bg.glassGfx, bg.cx, bg.baseY, bg.bw, bg.bh, bg.id, false);
    });

    // Animate scale platform
    this._redrawScalePlatform(true);
    this.tweens.add({
      targets: this.scaleLed,
      alpha: 0.2, duration: 100, yoyo: true, repeat: 2,
      onComplete: () => this.scaleLed.setAlpha(1)
    });
  }

  _addSalt(id, delta) {
    const cur = this.salts[id] ?? 0;
    this.salts[id] = Phaser.Math.Clamp(
      Math.round((cur + delta) * 10) / 10,
      0, this.maxSalt
    );

    // Spawn crystal particle burst on beaker
    const bg = this._beakerGroups[id - 1];
    if (delta > 0 && bg) {
      for (let i = 0; i < 6; i++) {
        const particle = this.add.rectangle(
          bg.cx + Phaser.Math.Between(-20, 20),
          bg.beakerTopY,
          3, 3, P.saltCrystal, 0.9
        ).setDepth(15);
        this.tweens.add({
          targets: particle,
          y: bg.baseY - bg.bh * 0.3,
          alpha: 0, duration: 500 + i * 80, ease: "Cubic.In",
          onComplete: () => particle.destroy()
        });
      }
    }
  }

  /* ─────────── UPDATE ─────────── */
  update(time, delta) {
    const dt = delta / 1000;

    this._beakerGroups.forEach(bg => {
      const id   = bg.id;
      const salt = this.salts[id] ?? 0;

      // Redraw glass (for selection state)
      this._drawGlass(bg.glassGfx, bg.cx, bg.baseY, bg.bw, bg.bh, id, false);

      // Water fill
      this._redrawWater(bg.waterGfx, salt, bg.cx, bg.baseY, bg.bw, bg.bh);

      // Salt crystals
      this._redrawSalt(bg.saltGfx, salt, bg.cx, bg.baseY, bg.bw, bg.bh);

      // Bubbles
      this._tickBubbles(bg.bubbleGfx, salt, bg.cx, bg.baseY, bg.bw, bg.bh, dt,
        bg._bubbles || (bg._bubbles = []));

      // Selected beaker subtle pulse on label
      if (id === this.selected) {
        const p = 1 + Math.sin(time * 0.004) * 0.015;
        bg.labelTxt.setScale(p);
      } else {
        bg.labelTxt.setScale(1);
      }

      // Salt amount text
      bg.saltAmtTxt.setText(`${salt.toFixed(1)} g`);
      const badgeCol = BEAKER_COLORS[id - 1];
      bg.saltAmtTxt.setColor(salt > 0 ? `#${badgeCol.toString(16).padStart(6,"0")}` : `#${P.textDim.toString(16).padStart(6,"0")}`);
    });

    // Smooth mass display
    const targetMass = this._massFor(this.selected);
    this._scaleDisplay = Phaser.Math.Linear(this._scaleDisplay, targetMass, 0.08);

    // Scale display text + LED flicker
    this.scaleDisplayTxt.setText(`${this._scaleDisplay.toFixed(1)} g`);
    const ledPulse = 0.7 + Math.sin(time * 0.006) * 0.3;
    this.scaleLed.setAlpha(ledPulse);

    // Smooth mass for chart
    [1,2,3].forEach(id => {
      this._displayMass[id] = Phaser.Math.Linear(
        this._displayMass[id] ?? this._massFor(id),
        this._massFor(id), 0.07
      );
    });
    this._drawMassChart();

    // LCD panel
    const salt = this.salts[this.selected] ?? 0;
    const mass  = this._massFor(this.selected);
    const salinity = ((salt / this.volumeMl) * 100).toFixed(1);
    const selColor = `#${BEAKER_COLORS[this.selected - 1].toString(16).padStart(6,"0")}`;

    this._lcdBeaker.setText(`${this.selected}`).setColor(selColor);
    this._lcdSalt.setText(`${salt.toFixed(1)}`).setColor(salt > 0 ? selColor : `#${P.lcdDim.toString(16).padStart(6,"0")}`);
    this._lcdMass.setText(`${mass.toFixed(1)}`);
    this._lcdVol.setText(`${this.volumeMl}`);
    this._lcdSalin.setText(`${salinity}%`).setColor(
      salt > 6 ? `#ff4422` : salt > 3 ? `#ffaa22` : `#${P.lcdOn.toString(16).padStart(6,"0")}`
    );

    // Comparison note
    const masses = [1,2,3].map(id => this._massFor(id));
    const maxId  = masses.indexOf(Math.max(...masses)) + 1;
    this.compNote.setText(`Heaviest:\nBeaker ${maxId}`);

    // Hint update
    this._hintTxt.setText(
      salt === 0
        ? `Beaker ${this.selected}: no salt — pure water baseline`
        : `Beaker ${this.selected}: ${salt.toFixed(1)}g salt  ·  Mass = ${mass.toFixed(1)}g  ·  Salinity = ${salinity}%`
    );

    this.emitMeasurement({
      beaker:    this.selected,
      saltGrams: salt.toFixed(1),
      massGrams: mass.toFixed(1),
      volumeMl:  this.volumeMl,
      salinity:  `${salinity}%`,
    });
  }
}