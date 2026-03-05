import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════════
   PALETTE  –  darkroom optics lab
═══════════════════════════════════════════════════ */
const P = {
  // Background
  bg:             0x080c12,
  bgMid:          0x0c1220,
  gridLine:       0x0f1a28,
  benchTop:       0x1a2030,
  benchEdge:      0x0f1520,
  benchSurface:   0x141c28,

  // Torch / light source
  torchBody:      0x2a3a4a,
  torchLens:      0xffee88,
  torchRim:       0x4a6a80,
  torchGlow:      0xffdd44,

  // Beam colours
  beamCore:       0xffee88,
  beamWide:       0xffcc44,
  beamGlow:       0xff8800,
  beamAfterCore:  0xffffff,
  beamAfterMid:   0xffee88,
  beamParticle:   0xffdd66,

  // Material slot
  slotFrame:      0x2a4a6a,
  slotGlass:      0xccddff,
  slotGlassDark:  0x668899,

  // Screen / sensor
  screenFrame:    0x1a3040,
  screenOff:      0x0a1020,
  screenDim:      0x441100,
  screenMid:      0xcc6600,
  screenBright:   0xffee88,
  screenHot:      0xffffff,
  screenGlow:     0xff8800,

  // Material cards
  cardBg:         0x0e1a28,
  cardBorder:     0x1e3a58,
  cardSelected:   0x00aaff,
  cardHover:      0x1a5080,

  // Photometer
  meterBg:        0x060c14,
  meterBorder:    0x1a3a5a,
  meterArc:       0x0a1e30,
  meterLow:       0xff3322,
  meterMid:       0xffaa22,
  meterHigh:      0xffee44,
  meterMax:       0xffffff,
  meterNeedle:    0xffffff,

  // Type badge
  opaque:         0xff3322,
  translucent:    0xffaa22,
  transparent:    0x44ff88,

  // Chart
  chartBg:        0x04080f,
  chartBar:       0x00aaff,
  chartBarHot:    0xffee44,
  chartGrid:      0x0a1828,

  // Panel
  panelBg:        0x060c14,
  panelBorder:    0x1a3a5a,
  panelAccent:    0x00aaff,
  lcdBg:          0x030608,
  lcdOn:          0x00ddff,
  lcdDim:         0x052030,

  // Text
  textBright:     0xd0eeff,
  textMid:        0x5a88aa,
  textDim:        0x1a3a5a,
};

/* ═══════════════════════════════════════════════════
   SCENE
═══════════════════════════════════════════════════ */
export default class L5_LightTransmissionScene extends BaseLabScene {
  constructor(opts) {
    super("L5_LightTransmissionScene", opts);
    this.materials = opts.labConfig?.materials ?? [
      { name: "Clear Glass",   transmission: 0.92, color: 0x88ccff, desc: "Very transparent — glass lets almost all light through." },
      { name: "Oiled Paper",   transmission: 0.45, color: 0xddcc88, desc: "Translucent — scatters light, forms a diffuse glow." },
      { name: "Frosted Glass", transmission: 0.30, color: 0xaabbcc, desc: "Translucent — blurs light, no clear image passes." },
      { name: "Cardboard",     transmission: 0.02, color: 0x886644, desc: "Opaque — blocks almost all light." },
      { name: "Tinted Film",   transmission: 0.55, color: 0x88aacc, desc: "Translucent — partial tinted transmission." },
    ];
    this.selected   = this.materials[0];
    this._prevSel   = null;
    this._displayTr = this.materials[0].transmission;
    this._particles = [];
    this._needleAngle = -Math.PI * 0.7;
    this._screenFlicker = 1;
  }

  /* ──────────────────────── CREATE ──────────────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._W = W; this._H = H;

    this._buildBackground(W, H);
    this._buildBench(W, H);
    this._buildTorch(W, H);
    this._buildMaterialSlot(W, H);
    this._buildSensorScreen(W, H);
    this._buildBeamLayer(W, H);
    this._buildMaterialCards(W, H);
    this._buildPhotometer(W, H);
    this._buildChart(W, H);
    this._buildHeader(W, H);

    // Select first material
    this._selectMaterial(this.materials[0], true);
  }

  /* ─────────── BACKGROUND ─────────── */
  _buildBackground(W, H) {
    this.add.rectangle(W/2, H/2, W, H, P.bg);

    // Fine dot grid
    const g = this.add.graphics();
    g.fillStyle(P.gridLine, 0.7);
    for (let x = 0; x <= W; x += 30) {
      for (let y = 0; y <= H; y += 30) {
        g.fillRect(x, y, 1, 1);
      }
    }

    // Vignette
    const v = this.add.graphics();
    v.fillStyle(0x000000, 0.55);
    v.fillRect(0, 0, W, 24);
    v.fillRect(0, H - 24, W, 24);
    v.fillRect(0, 0, 24, H);
    v.fillRect(W - 24, 0, 24, H);
  }

  /* ─────────── OPTICAL BENCH ─────────── */
  _buildBench(W, H) {
    const benchY = H * 0.55;
    this._benchY = benchY;

    const g = this.add.graphics().setDepth(2);
    // Main rail
    g.fillStyle(P.benchTop, 1);
    g.fillRoundedRect(60, benchY - 10, W - 120, 20, 4);
    g.lineStyle(1.5, P.benchEdge, 1);
    g.strokeRoundedRect(60, benchY - 10, W - 120, 20, 4);
    // Surface sheen
    g.fillStyle(0xffffff, 0.05);
    g.fillRoundedRect(60, benchY - 10, W - 120, 6, 4);
    // Rail groove
    g.fillStyle(P.benchSurface, 1);
    g.fillRoundedRect(80, benchY - 4, W - 160, 8, 2);

    // Measurement markings
    g.lineStyle(1, P.panelBorder, 0.4);
    for (let x = 100; x < W - 100; x += 30) {
      const len = (Math.round((x - 100) / 30)) % 5 === 0 ? 6 : 3;
      g.lineBetween(x, benchY - 10, x, benchY - 10 - len);
    }
  }

  /* ─────────── TORCH ─────────── */
  _buildTorch(W, H) {
    const tx = 108, ty = this._benchY - 60;
    this._torchX = tx;
    this._torchY = ty;
    this._torchLensX = tx + 44;

    const g = this.add.graphics().setDepth(6);

    // Body shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(tx - 46 + 3, ty - 22 + 4, 92, 44, 8);

    // Body
    g.fillStyle(P.torchBody, 1);
    g.fillRoundedRect(tx - 46, ty - 22, 92, 44, 8);
    g.lineStyle(1.5, P.torchRim, 0.6);
    g.strokeRoundedRect(tx - 46, ty - 22, 92, 44, 8);

    // Grip ridges
    g.lineStyle(2, P.benchSurface, 0.4);
    for (let i = 0; i < 4; i++) {
      g.lineBetween(tx - 30 + i * 8, ty - 20, tx - 30 + i * 8, ty + 20);
    }

    // Lens housing rim
    g.fillStyle(P.torchRim, 1);
    g.fillCircle(tx + 44, ty, 22);
    g.fillStyle(P.torchBody, 1);
    g.fillCircle(tx + 44, ty, 18);

    // Lens glow (animated)
    this.torchLensGfx = this.add.graphics().setDepth(7);
    this._redrawLens(1);

    // Label
    this.add.text(tx - 28, ty + 28, "LIGHT SOURCE", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 1
    }).setOrigin(0, 0).setDepth(7);
  }

  _redrawLens(intensity) {
    const g = this.torchLensGfx;
    g.clear();
    const tx = this._torchX, ty = this._torchY;

    // Outer glow halo
    g.fillStyle(P.torchGlow, intensity * 0.15);
    g.fillCircle(tx + 44, ty, 32);

    // Lens face
    const lensColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x44, g: 0x44, b: 0x44 },
      { r: 0xff, g: 0xee, b: 0x44 },
      100, Math.round(intensity * 100)
    );
    g.fillStyle(Phaser.Display.Color.GetColor(lensColor.r, lensColor.g, lensColor.b), 1);
    g.fillCircle(tx + 44, ty, 16);

    // Inner hot spot
    g.fillStyle(0xffffff, intensity * 0.7);
    g.fillCircle(tx + 40, ty - 5, 6);
  }

  /* ─────────── MATERIAL SLOT ─────────── */
  _buildMaterialSlot(W, H) {
    const sx = W * 0.44, sy = this._benchY - 60;
    this._slotX = sx; this._slotY = sy;
    const sw = 28, sh = 140;

    const g = this.add.graphics().setDepth(8);

    // Slot frame posts
    g.fillStyle(P.slotFrame, 1);
    g.fillRoundedRect(sx - 4, sy - sh/2 - 18, 8, sh + 36, 3);
    g.fillRoundedRect(sx - sw/2, sy - sh/2 - 8, sw, 8, 2);
    g.fillRoundedRect(sx - sw/2, sy + sh/2, sw, 8, 2);

    // Glass guides (top and bottom clips)
    g.fillStyle(P.torchRim, 1);
    [[sy - sh/2 - 4, 12], [sy + sh/2 - 8, 12]].forEach(([gy, gh]) => {
      g.fillRoundedRect(sx - sw/2 - 2, gy, sw + 4, gh, 3);
      g.lineStyle(1, P.slotGlassDark, 0.5);
      g.strokeRoundedRect(sx - sw/2 - 2, gy, sw + 4, gh, 3);
    });

    // Label
    this.add.text(sx, sy + sh/2 + 20, "MATERIAL\nSLOT", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, align: "center", letterSpacing: 1
    }).setOrigin(0.5, 0).setDepth(9);

    // Material tile (redrawn on selection)
    this.materialTileGfx = this.add.graphics().setDepth(9);
    this._slotSW = sw; this._slotSH = sh;
  }

  _redrawMaterialTile(material, tr) {
    const g = this.materialTileGfx;
    g.clear();
    const { _slotX: sx, _slotY: sy, _slotSW: sw, _slotSH: sh } = this;

    // Material fill
    const alpha = 0.12 + tr * 0.72;
    const col = material?.color ?? 0x88aacc;
    g.fillStyle(col, alpha);
    g.fillRoundedRect(sx - sw/2 + 2, sy - sh/2 + 4, sw - 4, sh - 8, 3);

    // Sheen
    g.fillStyle(0xffffff, 0.12 + tr * 0.18);
    g.fillRoundedRect(sx - sw/2 + 4, sy - sh/2 + 6, (sw - 8) * 0.45, sh * 0.4, 2);

    // Border
    g.lineStyle(1.5, col, 0.6);
    g.strokeRoundedRect(sx - sw/2 + 2, sy - sh/2 + 4, sw - 4, sh - 8, 3);
  }

  /* ─────────── SENSOR SCREEN ─────────── */
  _buildSensorScreen(W, H) {
    const scx = W * 0.78, scy = this._benchY - 60;
    this._scrnCX = scx; this._scrnCY = scy;
    const scw = 120, sch = 140;
    this._scrnW = scw; this._scrnH = sch;

    const g = this.add.graphics().setDepth(6);

    // Frame shadow
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(scx - scw/2 + 3, scy - sch/2 + 4, scw, sch, 8);

    // Frame body
    g.fillStyle(P.screenFrame, 1);
    g.fillRoundedRect(scx - scw/2, scy - sch/2, scw, sch, 8);
    g.lineStyle(2, P.panelBorder, 1);
    g.strokeRoundedRect(scx - scw/2, scy - sch/2, scw, sch, 8);
    // Frame accent
    g.fillStyle(P.panelAccent, 1);
    g.fillRoundedRect(scx - scw/2, scy - sch/2, scw, 4, { tl: 8, tr: 8, bl: 0, br: 0 });

    // Screen surface (redrawn in update)
    this.screenGfx = this.add.graphics().setDepth(7);

    // Label
    this.add.text(scx, scy + sch/2 + 14, "SENSOR SCREEN", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 1
    }).setOrigin(0.5, 0).setDepth(7);

    // Photocell icon
    this.add.text(scx, scy + sch/2 + 26, "[ LDR ]", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`
    }).setOrigin(0.5, 0).setDepth(7);
  }

  _redrawScreen(tr, time) {
    const g = this.screenGfx;
    g.clear();
    const { _scrnCX: scx, _scrnCY: scy, _scrnW: scw, _scrnH: sch } = this;
    const pad = 8;

    // Screen glow colour
    const warmth = tr;
    const screenCol = warmth < 0.1
      ? P.screenOff
      : warmth < 0.35
      ? Phaser.Display.Color.Interpolate.ColorWithColor({ r: 0x0a, g: 0x10, b: 0x20 }, { r: 0xcc, g: 0x66, b: 0x00 }, 100, Math.round(warmth * 100 / 0.35))
      : Phaser.Display.Color.Interpolate.ColorWithColor({ r: 0xcc, g: 0x66, b: 0x00 }, { r: 0xff, g: 0xee, b: 0x88 }, 100, Math.round((warmth - 0.35) / 0.65 * 100));

    const col = typeof screenCol === "number" ? screenCol
      : Phaser.Display.Color.GetColor(screenCol.r, screenCol.g, screenCol.b);

    // Screen fill
    g.fillStyle(col, 0.85);
    g.fillRoundedRect(scx - scw/2 + pad, scy - sch/2 + pad, scw - pad*2, sch - pad*2, 5);

    // Hot-spot at impact point
    if (tr > 0.1) {
      const hotR = 20 + tr * 20;
      g.fillStyle(0xffffff, tr * 0.3);
      g.fillCircle(scx, scy, hotR);
      g.fillStyle(0xffffff, tr * 0.15);
      g.fillCircle(scx, scy, hotR * 1.6);
    }

    // Flicker grain (faint dots on screen surface)
    if (tr > 0.05) {
      const flick = this._screenFlicker;
      g.fillStyle(0xffffff, tr * 0.04 * flick);
      for (let i = 0; i < 12; i++) {
        const fx = scx - scw/2 + pad + Math.sin(i * 1.7 + time * 0.001) * (scw - pad*2) * 0.45 + (scw - pad*2) * 0.5;
        const fy = scy - sch/2 + pad + Math.cos(i * 2.3 + time * 0.0007) * (sch - pad*2) * 0.45 + (sch - pad*2) * 0.5;
        g.fillCircle(fx, fy, 2);
      }
    }

    // Screen frame sheen
    g.fillStyle(0xffffff, 0.06);
    g.fillRoundedRect(scx - scw/2 + pad, scy - sch/2 + pad, (scw - pad*2) * 0.5, 10, 3);
  }

  /* ─────────── BEAM LAYER ─────────── */
  _buildBeamLayer(W, H) {
    this.beamGfx     = this.add.graphics().setDepth(4);
    this.beamGlowGfx = this.add.graphics().setDepth(3);
    this.particleGfx = this.add.graphics().setDepth(5);
  }

  _drawBeam(tr, time) {
    const bg  = this.beamGlowGfx;
    const g   = this.beamGfx;
    bg.clear(); g.clear();

    const torchLensX = this._torchLensX;
    const torchY     = this._torchY;
    const slotLeft   = this._slotX - this._slotSW / 2 - 2;
    const slotRight  = this._slotX + this._slotSW / 2 + 2;
    const screenLeft = this._scrnCX - this._scrnW / 2 + 8;
    const beamSpread = 34;   // half-height at slot
    const screenSpreadIn  = 36;
    const screenSpreadOut = tr > 0.3 ? 28 : 34 + (1 - tr) * 20;  // diffuse when low tr

    // ── Segment A: torch → slot ──
    const aAlpha = 0.55;
    // glow wide
    bg.fillStyle(P.beamGlow, aAlpha * 0.18);
    bg.fillTriangle(torchLensX, torchY,
      slotLeft, torchY - beamSpread - 10,
      slotLeft, torchY + beamSpread + 10);
    // core
    g.fillStyle(P.beamCore, aAlpha);
    g.fillTriangle(torchLensX, torchY,
      slotLeft, torchY - beamSpread,
      slotLeft, torchY + beamSpread);
    // bright centre line
    g.lineStyle(3, 0xffffff, aAlpha * 0.5);
    g.lineBetween(torchLensX, torchY, slotLeft, torchY);

    // ── Segment B: slot → screen (attenuated) ──
    if (tr > 0.005) {
      const bAlpha = tr * 0.55;
      // Diffuse glow when translucent/opaque
      bg.fillStyle(P.beamGlow, bAlpha * 0.2);
      bg.fillTriangle(slotRight, torchY - screenSpreadIn,
        slotRight, torchY + screenSpreadIn,
        screenLeft, torchY + screenSpreadOut);
      bg.fillTriangle(slotRight, torchY - screenSpreadIn,
        screenLeft, torchY - screenSpreadOut,
        screenLeft, torchY + screenSpreadOut);
      // Core
      g.fillStyle(P.beamAfterCore, bAlpha);
      g.fillTriangle(slotRight, torchY - screenSpreadIn * 0.7,
        slotRight, torchY + screenSpreadIn * 0.7,
        screenLeft, torchY + screenSpreadOut * 0.55);
      g.fillTriangle(slotRight, torchY - screenSpreadIn * 0.7,
        screenLeft, torchY - screenSpreadOut * 0.55,
        screenLeft, torchY + screenSpreadOut * 0.55);
      // Centre beam
      g.lineStyle(2, 0xffffff, bAlpha * 0.6);
      g.lineBetween(slotRight, torchY, screenLeft, torchY);
    }

    // ── Scatter halo at material interface ──
    if (tr > 0.01 && tr < 0.95) {
      const scatter = (1 - tr) * 0.35;
      bg.fillStyle(this.selected?.color ?? P.beamCore, scatter * 0.4);
      bg.fillCircle(this._slotX, torchY, 18 + (1 - tr) * 22);
    }
  }

  _tickParticles(dt, tr) {
    const pg = this.particleGfx;
    pg.clear();
    if (tr < 0.05) return;

    // Spawn along beam
    if (Math.random() < 0.25 * tr) {
      const sx = Phaser.Math.FloatBetween(this._slotRight ?? this._slotX, this._scrnCX - 20);
      const sy = this._torchY + Phaser.Math.FloatBetween(-18, 18) * tr;
      this._particles.push({ x: sx, y: sy, vx: Phaser.Math.FloatBetween(60, 130), vy: Phaser.Math.FloatBetween(-8, 8), alpha: 0.6 * tr, r: Phaser.Math.FloatBetween(1.5, 3) });
    }

    this._particles = this._particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= 0.9 * dt;
      if (p.alpha <= 0 || p.x > this._scrnCX) return false;
      pg.fillStyle(P.beamParticle, p.alpha);
      pg.fillCircle(p.x, p.y, p.r);
      return true;
    });
    this._slotRight = this._slotX + this._slotSW / 2 + 2;
  }

  /* ─────────── MATERIAL CARDS ─────────── */
  _buildMaterialCards(W, H) {
    const startY = H * 0.62;
    const cardW  = W * 0.16, cardH = H * 0.28;
    const gapX   = (W - 40 - this.materials.length * cardW) / (this.materials.length - 1);
    this._cards  = [];

    this.materials.forEach((m, i) => {
      const cx = 20 + cardW/2 + i * (cardW + gapX);
      const cy = startY + cardH/2;

      const cardGfx = this.add.graphics().setDepth(15);
      this._drawCard(cardGfx, cx, cy, cardW, cardH, m, false);

      // Colour swatch
      const swatch = this.add.graphics().setDepth(16);
      swatch.fillStyle(m.color, 0.7);
      swatch.fillRoundedRect(cx - cardW/2 + 8, cy - cardH/2 + 8, cardW - 16, cardH * 0.32, 5);
      swatch.fillStyle(0xffffff, 0.12);
      swatch.fillRoundedRect(cx - cardW/2 + 8, cy - cardH/2 + 8, (cardW - 16) * 0.5, cardH * 0.1, 3);

      // Name
      const nameText = this.add.text(cx, cy - cardH/2 + cardH * 0.44, m.name, {
        fontFamily: "'Courier New', monospace",
        fontSize: m.name.length > 10 ? "10px" : "11px",
        color: `#${P.textBright.toString(16).padStart(6,"0")}`,
        align: "center", wordWrap: { width: cardW - 12 }
      }).setOrigin(0.5, 0).setDepth(17);

      // Transmission %
      const pctText = this.add.text(cx, cy - cardH/2 + cardH * 0.68, `${Math.round(m.transmission * 100)}%`, {
        fontFamily: "'Georgia', serif", fontSize: "16px",
        color: `#${P.lcdOn.toString(16).padStart(6,"0")}`, fontStyle: "bold", align: "center"
      }).setOrigin(0.5, 0).setDepth(17);

      // Type badge
      const typeColor = this._typeColor(m.transmission);
      const typeText  = this.add.text(cx, cy - cardH/2 + cardH * 0.83, this._classify(m.transmission), {
        fontFamily: "'Courier New', monospace", fontSize: "9px",
        color: `#${typeColor.toString(16).padStart(6,"0")}`, align: "center"
      }).setOrigin(0.5, 0).setDepth(17);

      // Hit zone
      const hit = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true }).setDepth(18);
      hit.on("pointerover",  () => { if (this.selected !== m) this._drawCard(cardGfx, cx, cy, cardW, cardH, m, true, false); });
      hit.on("pointerout",   () => { if (this.selected !== m) this._drawCard(cardGfx, cx, cy, cardW, cardH, m, false, false); });
      hit.on("pointerdown",  () => this._selectMaterial(m));

      // Intro animation
      cardGfx.setAlpha(0); nameText.setAlpha(0); pctText.setAlpha(0); typeText.setAlpha(0); swatch.setAlpha(0);
      this.tweens.add({ targets: [cardGfx, nameText, pctText, typeText, swatch],
        alpha: 1, duration: 350, delay: 80 + i * 90, ease: "Sine.Out" });

      this._cards.push({ cardGfx, swatch, nameText, pctText, typeText, cx, cy, cardW, cardH, m });
    });
  }

  _drawCard(g, cx, cy, cw, ch, m, hover, selected) {
    g.clear();
    const isSel = selected ?? (this.selected === m);
    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(cx - cw/2 + 3, cy - ch/2 + 4, cw, ch, 10);
    // Body
    g.fillStyle(isSel ? 0x0a1e30 : P.cardBg, 1);
    g.fillRoundedRect(cx - cw/2, cy - ch/2, cw, ch, 10);
    // Border
    const borderCol = isSel ? P.cardSelected : hover ? P.cardHover : P.cardBorder;
    g.lineStyle(isSel ? 2.5 : 1.5, borderCol, 1);
    g.strokeRoundedRect(cx - cw/2, cy - ch/2, cw, ch, 10);
    // Selection glow
    if (isSel) {
      g.lineStyle(5, P.cardSelected, 0.15);
      g.strokeRoundedRect(cx - cw/2 - 3, cy - ch/2 - 3, cw + 6, ch + 6, 13);
    }
    // Sheen
    g.fillStyle(0xffffff, 0.05);
    g.fillRoundedRect(cx - cw/2 + 4, cy - ch/2 + 4, cw - 8, ch * 0.22, 7);
  }

  _selectMaterial(m, instant = false) {
    const prev = this.selected;
    this.selected = m;

    // Redraw all cards
    this._cards?.forEach(c => this._drawCard(c.cardGfx, c.cx, c.cy, c.cardW, c.cardH, c.m, false, this.selected === c.m));

    // Animate display transmission value
    const startTr = instant ? m.transmission : this._displayTr;
    this.tweens.addCounter({
      from: startTr * 100, to: m.transmission * 100, duration: instant ? 0 : 600, ease: "Cubic.Out",
      onUpdate: tw => { this._displayTr = tw.getValue() / 100; }
    });

    // Redraw material tile with colour
    this._redrawMaterialTile(m, m.transmission);

    // Pulse screen
    if (!instant) {
      this.tweens.add({ targets: this.screenGfx, alpha: 0.4, duration: 80, yoyo: true, repeat: 1 });
    }
  }

  /* ─────────── PHOTOMETER ─────────── */
  _buildPhotometer(W, H) {
    const px = W * 0.52, py = H * 0.62;
    const pw = W * 0.24, ph = H * 0.28;
    this._meterCX = px + pw/2;
    this._meterPY = py;

    const pg = this.add.graphics().setDepth(15);
    pg.fillStyle(0x000000, 0.3);
    pg.fillRoundedRect(px + 3, py + 4, pw, ph, 10);
    pg.fillStyle(P.meterBg, 1);
    pg.fillRoundedRect(px, py, pw, ph, 10);
    pg.lineStyle(1.5, P.meterBorder, 1);
    pg.strokeRoundedRect(px, py, pw, ph, 10);
    pg.fillStyle(P.panelAccent, 1);
    pg.fillRoundedRect(px, py, pw, 4, { tl: 10, tr: 10, bl: 0, br: 0 });

    const cx = px + pw/2;
    this.add.text(cx, py + 16, "PHOTOMETER", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(16);

    // Arc meter
    const r = 52;
    const meterY = py + ph * 0.58;
    this._arcCX = cx; this._arcCY = meterY; this._arcR = r;

    const ab = this.add.graphics().setDepth(16);
    ab.lineStyle(10, P.meterArc, 1);
    ab.beginPath();
    ab.arc(cx, meterY, r, Math.PI * 0.78, Math.PI * 2.22, false);
    ab.strokePath();

    // Ticks
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.78 + (i / 10) * Math.PI * 1.44;
      const ir = r - 7, or = r + (i % 5 === 0 ? 8 : 5);
      ab.lineStyle(i % 5 === 0 ? 2 : 1, P.textMid, i % 5 === 0 ? 0.7 : 0.35);
      ab.lineBetween(cx + Math.cos(a) * ir, meterY + Math.sin(a) * ir,
                     cx + Math.cos(a) * or, meterY + Math.sin(a) * or);
    }
    ["0", "50", "100"].forEach((lbl, i) => {
      const a = Math.PI * 0.78 + (i / 2) * Math.PI * 1.44;
      this.add.text(cx + Math.cos(a) * (r + 18), meterY + Math.sin(a) * (r + 18), lbl + "%", {
        fontFamily: "'Courier New', monospace", fontSize: "9px",
        color: `#${P.textDim.toString(16).padStart(6,"0")}`
      }).setOrigin(0.5).setDepth(17);
    });

    this.arcGfx    = this.add.graphics().setDepth(17);
    this.needleGfx = this.add.graphics().setDepth(18);
    this.arcLabel  = this.add.text(cx, meterY + 16, "0%", {
      fontFamily: "'Georgia', serif", fontSize: "16px",
      color: `#${P.lcdOn.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setOrigin(0.5).setDepth(18);

    // Type badge below
    this.typeBadge = this.add.text(cx, py + ph - 14, "OPAQUE", {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: `#${P.opaque.toString(16).padStart(6,"0")}`
    }).setOrigin(0.5).setDepth(17);
  }

  _updatePhotometer(tr) {
    const pct = tr * 100;
    const cx = this._arcCX, cy = this._arcCY, r = this._arcR;
    const targetAngle = Math.PI * 0.78 + tr * Math.PI * 1.44;
    this._needleAngle = Phaser.Math.Linear(this._needleAngle, targetAngle, 0.1);

    const g = this.arcGfx;
    g.clear();
    if (tr > 0.01) {
      const col = tr < 0.15 ? P.meterLow : tr < 0.5 ? P.meterMid : tr < 0.85 ? P.meterHigh : P.meterMax;
      g.lineStyle(10, col, 0.85);
      g.beginPath();
      g.arc(cx, cy, r, Math.PI * 0.78, this._needleAngle, false);
      g.strokePath();
    }

    const ng = this.needleGfx;
    ng.clear();
    ng.lineStyle(2.5, 0xffffff, 0.95);
    ng.lineBetween(cx, cy, cx + Math.cos(this._needleAngle) * (r - 5), cy + Math.sin(this._needleAngle) * (r - 5));
    ng.fillStyle(0xffffff, 1);
    ng.fillCircle(cx, cy, 5);
    ng.fillStyle(P.meterBg, 1);
    ng.fillCircle(cx, cy, 3);

    const col = tr < 0.15 ? P.meterLow : tr < 0.5 ? P.meterMid : tr < 0.85 ? P.meterHigh : P.meterMax;
    this.arcLabel.setText(`${Math.round(pct)}%`).setColor(`#${col.toString(16).padStart(6,"0")}`);

    const typeStr  = this._classify(tr);
    const typeCol  = this._typeColor(tr);
    this.typeBadge.setText(typeStr.toUpperCase()).setColor(`#${typeCol.toString(16).padStart(6,"0")}`);
  }

  /* ─────────── BAR CHART ─────────── */
  _buildChart(W, H) {
    const gx = W * 0.77, gy = H * 0.62;
    const gw = W - gx - 14, gh = H * 0.28;
    this._chartX = gx; this._chartY = gy;
    this._chartW = gw; this._chartH = gh;

    const bg = this.add.graphics().setDepth(15);
    bg.fillStyle(P.chartBg, 1);
    bg.fillRoundedRect(gx, gy, gw, gh, 8);
    bg.lineStyle(1.5, P.meterBorder, 1);
    bg.strokeRoundedRect(gx, gy, gw, gh, 8);
    bg.fillStyle(P.panelAccent, 1);
    bg.fillRoundedRect(gx, gy, gw, 4, { tl: 8, tr: 8, bl: 0, br: 0 });
    bg.lineStyle(1, P.chartGrid, 1);
    for (let i = 1; i < 4; i++) bg.lineBetween(gx + 8, gy + (gh/4)*i, gx + gw - 8, gy + (gh/4)*i);

    this.add.text(gx + gw/2, gy + 12, "ALL MATERIALS", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(16);

    this.chartGfx = this.add.graphics().setDepth(16);
    this._drawChart(-1);
  }

  _drawChart(selectedIdx) {
    const g = this.chartGfx;
    g.clear();
    const { _chartX: gx, _chartY: gy, _chartW: gw, _chartH: gh } = this;
    const pad = 14, barPad = 3;
    const n = this.materials.length;
    const barW = (gw - pad * 2 - barPad * (n - 1)) / n;

    this.materials.forEach((m, i) => {
      const bx = gx + pad + i * (barW + barPad);
      const barH = (gh - pad * 2 - 18) * m.transmission;
      const by = gy + gh - pad - barH;
      const isSel = this.selected === m;

      const col = isSel ? P.chartBarHot : P.chartBar;
      g.fillStyle(col, isSel ? 0.9 : 0.5);
      g.fillRoundedRect(bx, by, barW, barH, 3);
      // Sheen
      g.fillStyle(0xffffff, isSel ? 0.2 : 0.08);
      g.fillRoundedRect(bx + 2, by + 2, barW - 4, Math.min(8, barH - 4), 2);
    });
  }

  /* ─────────── HEADER ─────────── */
  _buildHeader(W, H) {
    const hg = this.add.graphics().setDepth(20);
    hg.fillStyle(P.panelBg, 0.92);
    hg.fillRoundedRect(14, 6, W - 28, 54, 8);
    hg.lineStyle(1.5, P.panelBorder, 1);
    hg.strokeRoundedRect(14, 6, W - 28, 54, 8);
    hg.fillStyle(P.panelAccent, 1);
    hg.fillRect(14, 6, 4, 54);

    this.add.text(26, 12, "LAB 05", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 3
    }).setDepth(21);
    this.add.text(26, 28, "Light Transmission", {
      fontFamily: "'Georgia', serif", fontSize: "19px",
      color: `#${P.textBright.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setDepth(21);
    this._hintTxt = this.add.text(W - 20, 22, `Material: ${this.selected.name}  ·  Click a card below to change the material`, {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: `#${P.textMid.toString(16).padStart(6,"0")}`, align: "right"
    }).setOrigin(1, 0).setDepth(21);
    this._descTxt = this.add.text(W - 20, 40, "", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, align: "right"
    }).setOrigin(1, 0).setDepth(21);
  }

  /* ─────────── HELPERS ─────────── */
  _classify(tr) {
    if (tr >= 0.75) return "Transparent";
    if (tr >= 0.15) return "Translucent";
    return "Opaque";
  }
  _typeColor(tr) {
    if (tr >= 0.75) return P.transparent;
    if (tr >= 0.15) return P.translucent;
    return P.opaque;
  }

  /* ─────────── UPDATE ─────────── */
  update(time, delta) {
    const dt = delta / 1000;
    const tr = this._displayTr;

    // Lens flicker
    this._redrawLens(1);

    // Beam
    this._drawBeam(tr, time);
    this._tickParticles(dt, tr);

    // Material tile shimmer
    this._redrawMaterialTile(this.selected, tr);

    // Screen
    this._screenFlicker = 0.88 + 0.12 * Math.sin(time * 0.007);
    this._redrawScreen(tr, time);

    // Photometer arc + needle
    this._updatePhotometer(tr);

    // Chart
    this._drawChart();

    // Torch lens pulse
    const lensGlow = 1 + Math.sin(time * 0.004) * 0.04;
    this.torchLensGfx.setScale(lensGlow);

    // Header hint
    this._hintTxt.setText(`Material: ${this.selected.name}  ·  Transmission: ${Math.round(tr * 100)}%  ·  ${this._classify(tr)}`);
    this._descTxt.setText(this.selected.desc ?? "");

    this.emitMeasurement({
      material:     this.selected.name,
      transmission: `${Math.round(tr * 100)}%`,
      type:         this._classify(tr),
    });
  }
}