import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════════
   PALETTE  –  stormy coastal / weather station
═══════════════════════════════════════════════════ */
const P = {
  // Sky layers
  skyTop:        0x0d1a2e,
  skyMid:        0x1a2e48,
  skyHorizon:    0x2a4a6a,
  skyStorm:      0x0a1220,

  // Ground / scene
  ground:        0x2a4a2a,
  groundDark:    0x1a3018,
  groundShadow:  0x0f2010,
  puddle:        0x1a3a5a,
  puddleShine:   0x4a7aaa,

  // Clouds
  cloudLight:    0x6a7a8a,
  cloudMid:      0x4a5a6a,
  cloudDark:     0x2a3a4a,
  cloudStorm:    0x1a2a3a,

  // Rain
  rainDrop:      0x88bbdd,
  rainSplash:    0xaaccee,
  rainHeavy:     0x5599cc,

  // Rain gauge
  gaugeGlass:    0xd8eef8,
  gaugeGlassDim: 0xa8cce0,
  gaugeFrame:    0x4a6a80,
  gaugeFrameDark:0x2a4a60,
  gaugeCap:      0x8aaac0,
  gaugeFunnel:   0x6a8aaa,
  waterCold:     0x2277cc,
  waterFull:     0x0044aa,
  waterSheen:    0x88ccff,
  tickMajor:     0x5a8aaa,
  tickMinor:     0x3a6080,
  tickLabel:     0x88aacc,

  // Thunder
  lightning:     0xffffaa,
  lightningGlow: 0xffff44,

  // Panel
  panelBg:       0x060d14,
  panelBorder:   0x1a3a5a,
  panelAccent:   0x2288cc,
  lcdBg:         0x040810,
  lcdOn:         0x44aaff,
  lcdDim:        0x08182a,

  // Slider
  sliderTrack:   0x0a1e30,
  sliderFill:    0x2288cc,
  sliderThumb:   0xffffff,
  sliderWet:     0x44bbff,

  // Chart
  chartBg:       0x040a12,
  chartLine:     0x2299ee,
  chartDot:      0x44aaff,
  chartGrid:     0x0a1828,

  // Buttons
  btnBg:         0x0a1828,
  btnHover:      0x1a3a5a,
  btnBorder:     0x2288cc,

  // Text
  textBright:    0xd0e8ff,
  textMid:       0x5a88aa,
  textDim:       0x1a3a5a,
};

export default class L11_RainGaugeScene extends BaseLabScene {
  constructor(opts) {
    super("L11_RainGaugeScene", opts);
    this.maxRainRate  = opts.labConfig?.maxRainRate  ?? 10;
    this.fillFactor   = opts.labConfig?.fillFactor   ?? 0.25;
    this.rainRate     = 3;
    this.mm           = 0;
    this.timeMin      = 0;

    // Rain drops pool
    this._drops       = [];
    this._splashes    = [];
    this._puddles     = [];
    this._lightning   = 0;     // countdown frames for lightning flash
    this._lightningX  = 0;
    this._lightningY  = 0;
    this._graphPoints = [];
    this._maxGraphPts = 80;
    this._isDragging  = false;
    this._displayMM   = 0;
  }

  /* ──────────────────────── CREATE ──────────────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._W = W; this._H = H;

    this._buildSky(W, H);
    this._buildClouds(W, H);
    this._buildGround(W, H);
    this._buildPuddles(W, H);
    this._buildRainLayer(W, H);
    this._buildGauge(W, H);
    this._buildPanel(W, H);
    this._buildSlider(W, H);
    this._buildGraph(W, H);
    this._buildHeader(W, H);
    this._hookKeys();

    this._initDropPool(W, H);
  }

  /* ─────────── SKY ─────────── */
  _buildSky(W, H) {
    // Layered dark stormy sky
    this.add.rectangle(W/2, H * 0.12, W, H * 0.24, P.skyStorm);
    this.add.rectangle(W/2, H * 0.30, W, H * 0.24, P.skyTop);
    this.add.rectangle(W/2, H * 0.48, W, H * 0.24, P.skyMid);

    // Sky glow that flashes on lightning
    this.skyFlash = this.add.rectangle(W/2, H * 0.3, W, H * 0.65, 0xffffff, 0).setAlpha(0);
  }

  /* ─────────── CLOUDS ─────────── */
  _buildClouds(W, H) {
    this._cloudLayers = [];

    // Three layers of clouds at different depths
    const cloudDefs = [
      { x: W * 0.18, y: H * 0.12, scale: 1.3, depth: 2, speed: 0.11 },
      { x: W * 0.52, y: H * 0.08, scale: 1.6, depth: 1, speed: 0.07 },
      { x: W * 0.80, y: H * 0.15, scale: 1.0, depth: 3, speed: 0.14 },
      { x: W * 0.35, y: H * 0.19, scale: 0.9, depth: 4, speed: 0.09 },
    ];

    cloudDefs.forEach(({ x, y, scale, depth, speed }) => {
      const g = this.add.graphics().setDepth(depth);
      this._drawStormCloud(g, x, y, scale);
      this._cloudLayers.push({ g, baseX: x, y, scale, speed, phase: Math.random() * Math.PI * 2 });
    });
  }

  _drawStormCloud(g, x, y, scale) {
    g.clear();
    // Multi-layer cloud for storm depth
    const layers = [
      { col: P.cloudDark,  alpha: 1,    offsets: [[0,0,52],[-55,15,40],[55,15,40],[-28,28,36],[28,28,36],[0,32,44]] },
      { col: P.cloudMid,   alpha: 0.85, offsets: [[0,-8,42],[-40,6,34],[40,6,34]] },
      { col: P.cloudLight, alpha: 0.4,  offsets: [[-15,-14,22],[15,-14,20]] },
    ];
    layers.forEach(({ col, alpha, offsets }) => {
      g.fillStyle(col, alpha);
      offsets.forEach(([dx, dy, r]) => g.fillCircle(x + dx * scale, y + dy * scale, r * scale));
    });
    // Rain curtain below cloud
    g.fillStyle(P.cloudStorm, 0.12);
    g.fillRect(x - 60 * scale, y + 30 * scale, 120 * scale, 40 * scale);
  }

  /* ─────────── GROUND ─────────── */
  _buildGround(W, H) {
    const gy = H * 0.72;
    this._groundY = gy;
    this.add.rectangle(W/2, gy + (H - gy)/2, W, H - gy, P.ground);
    this.add.rectangle(W/2, gy + 5, W, 10, P.groundDark);

    // Wet sheen on ground
    this.groundSheen = this.add.graphics();
    this.groundSheen.fillStyle(P.puddleShine, 0.06);
    this.groundSheen.fillRect(0, gy, W, H - gy);
  }

  /* ─────────── PUDDLES ─────────── */
  _buildPuddles(W, H) {
    this.puddleGfx = this.add.graphics().setDepth(3);
    this._puddles = [
      { x: W * 0.2,  y: this._groundY + 12, rw: 48, rh: 8, alpha: 0 },
      { x: W * 0.44, y: this._groundY + 16, rw: 36, rh: 7, alpha: 0 },
      { x: W * 0.12, y: this._groundY + 22, rw: 28, rh: 6, alpha: 0 },
    ];
  }

  _redrawPuddles(fillPct) {
    const g = this.puddleGfx;
    g.clear();
    this._puddles.forEach(p => {
      const a = Phaser.Math.Clamp(fillPct * 1.5, 0, 0.45);
      g.fillStyle(P.puddle, a);
      g.fillEllipse(p.x, p.y, p.rw * (0.5 + fillPct), p.rh);
      g.fillStyle(P.puddleShine, a * 0.3);
      g.fillEllipse(p.x - p.rw * 0.15, p.y - 1, p.rw * 0.4, p.rh * 0.5);
    });
  }

  /* ─────────── RAIN LAYER ─────────── */
  _buildRainLayer(W, H) {
    this.rainGfx    = this.add.graphics().setDepth(8);
    this.splashGfx  = this.add.graphics().setDepth(9);
  }

  _initDropPool(W, H) {
    this._drops = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      this._drops.push({
        x: Phaser.Math.Between(0, W),
        y: Phaser.Math.FloatBetween(-H, H),
        len: Phaser.Math.FloatBetween(8, 22),
        speed: Phaser.Math.FloatBetween(280, 480),
        active: false,
      });
    }
  }

  _updateRain(dt, W, H) {
    const g = this.rainGfx;
    const sg = this.splashGfx;
    g.clear();
    sg.clear();

    const intensity = this.rainRate / this.maxRainRate;
    const activeCount = Math.floor(intensity * this._drops.length);
    const angle = 0.12;  // slight wind angle

    // Activate drops
    for (let i = 0; i < this._drops.length; i++) {
      const d = this._drops[i];
      d.active = i < activeCount;
    }

    const alpha = 0.25 + intensity * 0.55;
    g.lineStyle(1.5, P.rainDrop, alpha);

    for (const d of this._drops) {
      if (!d.active) continue;

      d.y += d.speed * dt;
      d.x += Math.sin(angle) * d.speed * dt * 0.15;

      if (d.y > this._groundY + 10) {
        // Splash
        this._splashes.push({
          x: d.x, y: this._groundY,
          r: 0, maxR: Phaser.Math.FloatBetween(4, 9),
          alpha: 0.5, life: 1
        });
        d.y = Phaser.Math.FloatBetween(-80, 0);
        d.x = Phaser.Math.Between(0, W);
        d.speed = Phaser.Math.FloatBetween(280, 480);
      }

      const dx = Math.sin(angle) * d.len;
      g.lineBetween(d.x, d.y, d.x - dx, d.y - d.len);
    }

    // Draw splashes
    this._splashes = this._splashes.filter(s => {
      s.r += 12 * dt;
      s.alpha -= 1.8 * dt;
      s.life -= dt;
      if (s.alpha <= 0 || s.r > s.maxR) return false;
      sg.lineStyle(1, P.rainSplash, s.alpha * alpha);
      sg.strokeCircle(s.x, s.y, s.r);
      return true;
    });
  }

  /* ─────────── GAUGE ─────────── */
  _buildGauge(W, H) {
    const gx = W * 0.62;
    const gy = H * 0.2;
    const gw = 80, gh = 280;

    this._gaugeCX = gx;
    this._gaugeTopY = gy;
    this._gaugeH = gh;
    this._gaugeW = gw;

    const g = this.add.graphics().setDepth(10);

    // Mounting post
    g.fillStyle(P.gaugeFrameDark, 1);
    g.fillRect(gx - 6, gy + gh, 12, H * 0.72 + H * 0.28 - gy - gh);
    g.fillRect(gx - 28, H * 0.72 - 8, 56, 16);

    // Funnel top
    g.fillStyle(P.gaugeFunnel, 1);
    g.fillTriangle(gx - 52, gy - 20, gx + 52, gy - 20, gx - 5, gy + 8);
    g.fillTriangle(gx - 52, gy - 20, gx + 52, gy - 20, gx + 5, gy + 8);
    g.lineStyle(2, P.gaugeCap, 0.8);
    g.lineBetween(gx - 52, gy - 20, gx + 52, gy - 20);

    // Funnel rim
    g.fillStyle(P.gaugeCap, 1);
    g.fillRect(gx - 54, gy - 26, 108, 10);
    g.lineStyle(1.5, P.gaugeFrameDark, 1);
    g.strokeRect(gx - 54, gy - 26, 108, 10);

    // Tube outer shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(gx - gw/2 + 3, gy + 6, gw, gh, 6);

    // Tube frame
    g.fillStyle(P.gaugeFrame, 1);
    g.fillRoundedRect(gx - gw/2, gy, gw, gh, 6);
    g.lineStyle(2, P.gaugeFrameDark, 1);
    g.strokeRoundedRect(gx - gw/2, gy, gw, gh, 6);

    // Glass inner
    g.fillStyle(P.gaugeGlass, 0.12);
    g.fillRoundedRect(gx - gw/2 + 6, gy + 4, gw - 12, gh - 8, 4);
    g.lineStyle(1, P.gaugeGlassDim, 0.35);
    g.strokeRoundedRect(gx - gw/2 + 6, gy + 4, gw - 12, gh - 8, 4);

    // Sheen strip
    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(gx - gw/2 + 8, gy + 6, 10, gh - 12, 3);

    // Tick marks & labels
    const maxMM = 100, ticks = 10;
    for (let i = 0; i <= ticks; i++) {
      const norm = i / ticks;
      const ty = gy + gh - 6 - norm * (gh - 12);
      const isMajor = i % 2 === 0;

      g.lineStyle(isMajor ? 2 : 1, isMajor ? P.tickMajor : P.tickMinor, isMajor ? 0.9 : 0.5);
      g.lineBetween(gx + gw/2, ty, gx + gw/2 + (isMajor ? 14 : 8), ty);

      if (isMajor) {
        this.add.text(gx + gw/2 + 18, ty, `${i * 10}`, {
          fontFamily: "'Courier New', monospace", fontSize: "11px",
          color: `#${P.tickLabel.toString(16).padStart(6,"0")}`
        }).setOrigin(0, 0.5).setDepth(11);
      }
    }
    this.add.text(gx + gw/2 + 18, gy + gh + 10, "mm", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.tickLabel.toString(16).padStart(6,"0")}`
    }).setDepth(11);

    // Current level line
    this.levelLine = this.add.graphics().setDepth(12);

    // Water fill (drawn each frame)
    this.waterGfx = this.add.graphics().setDepth(11);

    // Bubble gfx inside gauge
    this.bubbleGfx = this.add.graphics().setDepth(12);
    this._gaugeBubbles = [];

    // mm display above gauge
    this.gaugeMmLabel = this.add.text(gx, gy - 42, "0.0 mm", {
      fontFamily: "'Georgia', serif", fontSize: "20px",
      color: "#44aaff", fontStyle: "bold", align: "center"
    }).setOrigin(0.5).setDepth(13);
    this.add.text(gx, gy - 62, "COLLECTED", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.textMid.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(13);
  }

  _redrawWater(mm) {
    const g = this.waterGfx;
    g.clear();
    const { _gaugeCX: gx, _gaugeTopY: gy, _gaugeH: gh, _gaugeW: gw } = this;
    const fillH = Math.max(0, (mm / 100) * (gh - 12));
    const fillY = gy + gh - 6 - fillH;

    if (fillH < 1) return;

    const pct = mm / 100;
    const wColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x22, g: 0x77, b: 0xcc },
      { r: 0x00, g: 0x44, b: 0xaa },
      100, Math.round(pct * 100)
    );
    const col = Phaser.Display.Color.GetColor(wColor.r, wColor.g, wColor.b);

    // Water body
    g.fillStyle(col, 0.65 + pct * 0.2);
    g.fillRoundedRect(gx - gw/2 + 7, fillY, gw - 14, fillH, { tl: 0, tr: 0, bl: 3, br: 3 });

    // Surface shimmer
    g.fillStyle(P.waterSheen, 0.18);
    g.fillRoundedRect(gx - gw/2 + 9, fillY + 2, gw - 22, 5, 3);

    // Level indicator line
    const ll = this.levelLine;
    ll.clear();
    ll.lineStyle(2, P.lcdOn, 0.7);
    ll.lineBetween(gx - gw/2 + 5, fillY, gx + gw/2 - 5, fillY);
    ll.lineStyle(1, P.lcdOn, 0.25);
    ll.lineBetween(gx - gw/2 + 5, fillY + 2, gx + gw/2 - 5, fillY + 2);
  }

  _tickGaugeBubbles(dt, mm) {
    const g = this.bubbleGfx;
    g.clear();
    if (mm < 2 || this.rainRate === 0) return;
    const { _gaugeCX: gx, _gaugeTopY: gy, _gaugeH: gh, _gaugeW: gw } = this;
    const fillH = (mm / 100) * (gh - 12);
    const waterTop = gy + gh - 6 - fillH;

    if (Math.random() < 0.06 * (this.rainRate / this.maxRainRate)) {
      this._gaugeBubbles.push({
        x: gx + Phaser.Math.FloatBetween(-18, 18),
        y: gy + gh - 10,
        r: Phaser.Math.FloatBetween(1.5, 3.5),
        speed: Phaser.Math.FloatBetween(12, 24),
        alpha: 0.5
      });
    }

    this._gaugeBubbles = this._gaugeBubbles.filter(b => {
      b.y -= b.speed * dt;
      b.alpha -= 0.5 * dt;
      if (b.y < waterTop || b.alpha <= 0) return false;
      g.lineStyle(1, P.waterSheen, b.alpha);
      g.strokeCircle(b.x, b.y, b.r);
      return true;
    });
  }

  /* ─────────── INSTRUMENT PANEL ─────────── */
  _buildPanel(W, H) {
    const px = 18, py = 70;
    const pw = W * 0.44, ph = H * 0.54;

    this._panelX = px; this._panelY = py;
    this._panelW = pw; this._panelH = ph;

    const pg = this.add.graphics().setDepth(5);
    pg.fillStyle(0x000000, 0.35);
    pg.fillRoundedRect(px + 3, py + 5, pw, ph, 10);
    pg.fillStyle(P.panelBg, 1);
    pg.fillRoundedRect(px, py, pw, ph, 10);
    pg.lineStyle(2, P.panelBorder, 1);
    pg.strokeRoundedRect(px, py, pw, ph, 10);
    pg.fillStyle(P.panelAccent, 1);
    pg.fillRoundedRect(px, py, pw, 5, { tl: 10, tr: 10, bl: 0, br: 0 });

    const cx = px + pw / 2;
    this.add.text(cx, py + 18, "WEATHER STATION", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 3
    }).setOrigin(0.5).setDepth(6);

    const lcdRow = (label, yy) => {
      const lh = 32, lx = px + 10, lw = pw - 20;
      const lg = this.add.graphics().setDepth(6);
      lg.fillStyle(P.lcdBg, 1);
      lg.fillRoundedRect(lx, yy, lw, lh, 5);
      lg.lineStyle(1, P.panelBorder, 1);
      lg.strokeRoundedRect(lx, yy, lw, lh, 5);
      this.add.text(lx + 6, yy + 4, label, {
        fontFamily: "'Courier New', monospace", fontSize: "8px",
        color: `#${P.lcdDim.toString(16).padStart(6,"0")}`, letterSpacing: 1
      }).setDepth(7);
      const ghost = this.add.text(lx + lw - 6, yy + lh/2, "000.0", {
        fontFamily: "'Courier New', monospace", fontSize: "14px",
        color: `#${P.lcdDim.toString(16).padStart(6,"0")}`
      }).setOrigin(1, 0.5).setDepth(7);
      const val = this.add.text(lx + lw - 6, yy + lh/2, "—", {
        fontFamily: "'Courier New', monospace", fontSize: "14px",
        color: `#${P.lcdOn.toString(16).padStart(6,"0")}`
      }).setOrigin(1, 0.5).setDepth(8);
      return val;
    };

    let ry = py + 34;
    this._lcdRate   = lcdRow("RAIN RATE (0–10)", ry); ry += 38;
    this._lcdMM     = lcdRow("COLLECTED (mm)",   ry); ry += 38;
    this._lcdTime   = lcdRow("ELAPSED (min)",    ry); ry += 38;
    this._lcdRate2  = lcdRow("FILL RATE (mm/s)", ry); ry += 46;

    // Rain intensity bar
    this.add.text(cx, ry, "RAIN INTENSITY", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(7);
    ry += 14;

    const barW = pw - 28, barH = 12;
    const barg = this.add.graphics().setDepth(7);
    barg.fillStyle(P.sliderTrack, 1);
    barg.fillRoundedRect(px + 14, ry, barW, barH, 5);
    // Intensity bar segments
    for (let i = 0; i < 10; i++) {
      const segX = px + 14 + i * (barW / 10) + 1;
      barg.fillStyle(P.panelBg, 1);
      barg.fillRect(segX + barW/10 - 2, ry, 2, barH);
    }

    this.intensityBarGfx = this.add.graphics().setDepth(8);
    this._intensityBarX = px + 14;
    this._intensityBarY = ry;
    this._intensityBarW = barW;
    this._intensityBarH = barH;

    // Reset button
    ry += 24;
    this.resetBtnGfx = this.add.graphics().setDepth(7);
    this.resetBtnLabel = this.add.text(cx, ry + 13, "↺  Reset Gauge", {
      fontFamily: "'Courier New', monospace", fontSize: "12px",
      color: `#${P.textMid.toString(16).padStart(6,"0")}`
    }).setOrigin(0.5).setDepth(8);
    this._resetBtnCX = cx; this._resetBtnY = ry;
    this._resetBtnW = pw - 28;
    this._drawResetBtn(false);

    const resetHit = this.add.rectangle(cx, ry + 13, pw - 28, 28, 0xffffff, 0.001).setDepth(9)
      .setInteractive({ useHandCursor: true });
    resetHit.on("pointerover",  () => { this._drawResetBtn(true);  this.resetBtnLabel.setColor("#aaddff"); });
    resetHit.on("pointerout",   () => { this._drawResetBtn(false); this.resetBtnLabel.setColor(`#${P.textMid.toString(16).padStart(6,"0")}`); });
    resetHit.on("pointerdown",  () => this._reset());
  }

  _drawResetBtn(hovered) {
    const g = this.resetBtnGfx;
    g.clear();
    const { _resetBtnCX: cx, _resetBtnY: ry, _resetBtnW: bw } = this;
    g.fillStyle(hovered ? P.btnHover : P.btnBg, 1);
    g.fillRoundedRect(cx - bw/2, ry, bw, 28, 6);
    g.lineStyle(1.5, hovered ? P.panelAccent : P.panelBorder, 1);
    g.strokeRoundedRect(cx - bw/2, ry, bw, 28, 6);
  }

  _reset() {
    this.mm = 0;
    this.timeMin = 0;
    this._displayMM = 0;
    this._graphPoints = [];
    this._gaugeBubbles = [];
    this._drawGraph();
  }

  /* ─────────── SLIDER ─────────── */
  _buildSlider(W, H) {
    const py = this._panelY + this._panelH + 12;
    const px = 18, pw = this._panelW;
    const sw = pw - 28, sh = 10;
    const sx = px + 14;

    this._sliderPY = py;
    this._sliderSX = sx;
    this._sliderSW = sw;

    const sbg = this.add.graphics().setDepth(6);
    sbg.fillStyle(P.panelBg, 0.9);
    sbg.fillRoundedRect(px, py, pw, 52, 8);
    sbg.lineStyle(1.5, P.panelBorder, 1);
    sbg.strokeRoundedRect(px, py, pw, 52, 8);

    // Rain icons on ends
    this.add.text(px + 8,  py + 26, "🌂", { fontSize: "16px" }).setOrigin(0, 0.5).setDepth(7);
    this.add.text(px + pw - 8, py + 26, "🌧️", { fontSize: "16px" }).setOrigin(1, 0.5).setDepth(7);

    const track = this.add.graphics().setDepth(6);
    track.fillStyle(P.sliderTrack, 1);
    track.fillRoundedRect(sx + 22, py + 21, sw - 44, sh, 4);

    this.sliderFillGfx  = this.add.graphics().setDepth(7);
    this.sliderThumbGfx = this.add.graphics().setDepth(8);
    this.sliderValLabel = this.add.text(px + pw/2, py + 42, "", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.lcdOn.toString(16).padStart(6,"0")}`, align: "center"
    }).setOrigin(0.5).setDepth(8);

    this._redrawSlider();

    const hit = this.add.rectangle(px + pw/2, py + 26, pw - 20, 28, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true }).setDepth(9);
    hit.on("pointerdown",  (p) => { this._isDragging = true; this._updateSlider(p); });
    this.input.on("pointermove", (p) => { if (this._isDragging) this._updateSlider(p); });
    this.input.on("pointerup",   () => { this._isDragging = false; });
  }

  _updateSlider(p) {
    const rx = Phaser.Math.Clamp(p.x - this._sliderSX - 22, 0, this._sliderSW - 44);
    this.rainRate = Math.round((rx / (this._sliderSW - 44)) * this.maxRainRate);
    this._redrawSlider();
  }

  _redrawSlider() {
    const g = this.sliderFillGfx, tg = this.sliderThumbGfx;
    g.clear(); tg.clear();
    const { _sliderPY: py, _sliderSX: sx, _sliderSW: sw } = this;
    const tw = sw - 44, tx = sx + 22;
    const pct = this.rainRate / this.maxRainRate;

    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x22, g: 0x77, b: 0xcc },
      { r: 0x44, g: 0xbb, b: 0xff },
      100, Math.round(pct * 100)
    );
    const fillCol = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
    g.fillStyle(fillCol, 1);
    g.fillRoundedRect(tx, py + 21, tw * pct, 10, 4);

    const thumbX = tx + tw * pct;
    tg.fillStyle(P.sliderThumb, 1);
    tg.fillCircle(thumbX, py + 26, 11);
    tg.lineStyle(2.5, fillCol, 1);
    tg.strokeCircle(thumbX, py + 26, 11);
    tg.fillStyle(fillCol, 1);
    tg.fillCircle(thumbX, py + 26, 5);

    this.sliderValLabel.setText(`Rain Rate: ${this.rainRate} / ${this.maxRainRate}`);
  }

  /* ─────────── GRAPH ─────────── */
  _buildGraph(W, H) {
    const gx = 18, gy = this._panelY + this._panelH + 72;
    const gw = this._panelW, gh = H - gy - 16;

    this._graphX = gx; this._graphY = gy;
    this._graphW = gw; this._graphH = gh;

    const bg = this.add.graphics().setDepth(5);
    bg.fillStyle(P.chartBg, 1);
    bg.fillRoundedRect(gx, gy, gw, gh, 8);
    bg.lineStyle(1.5, P.panelBorder, 1);
    bg.strokeRoundedRect(gx, gy, gw, gh, 8);
    bg.lineStyle(1, P.chartGrid, 1);
    for (let i = 1; i < 4; i++) bg.lineBetween(gx + 8, gy + (gh/4)*i, gx + gw - 8, gy + (gh/4)*i);

    this.add.text(gx + gw/2, gy + 8, "MM TREND", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(6);

    this.graphGfx = this.add.graphics().setDepth(7);
  }

  _drawGraph() {
    const g = this.graphGfx;
    g.clear();
    const pts = this._graphPoints;
    if (pts.length < 2) return;
    const { _graphX: gx, _graphY: gy, _graphW: gw, _graphH: gh } = this;
    const pad = 12;

    const toX = (i) => gx + pad + (i / (this._maxGraphPts - 1)) * (gw - pad * 2);
    const toY = (v) => gy + gh - pad - (v / 100) * (gh - pad * 2);

    // Fill area under line
    g.fillStyle(P.chartLine, 0.08);
    g.beginPath();
    g.moveTo(toX(0), toY(pts[0]));
    pts.forEach((v, i) => g.lineTo(toX(i), toY(v)));
    g.lineTo(toX(pts.length - 1), gy + gh - pad);
    g.lineTo(toX(0), gy + gh - pad);
    g.closePath();
    g.fillPath();

    // Line
    g.lineStyle(2, P.chartLine, 0.9);
    for (let i = 1; i < pts.length; i++) {
      g.lineBetween(toX(i-1), toY(pts[i-1]), toX(i), toY(pts[i]));
    }
    // Latest dot
    g.fillStyle(P.chartDot, 1);
    g.fillCircle(toX(pts.length - 1), toY(pts[pts.length - 1]), 3);
  }

  /* ─────────── HEADER ─────────── */
  _buildHeader(W, H) {
    const hg = this.add.graphics().setDepth(15);
    hg.fillStyle(P.panelBg, 0.92);
    hg.fillRoundedRect(W * 0.44 + 8, 6, W * 0.56 - 22, 56, 8);
    hg.lineStyle(1.5, P.panelBorder, 1);
    hg.strokeRoundedRect(W * 0.44 + 8, 6, W * 0.56 - 22, 56, 8);
    hg.fillStyle(P.panelAccent, 1);
    hg.fillRect(W * 0.44 + 8, 6, 4, 56);

    this.add.text(W * 0.44 + 20, 12, "LAB 11", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 3
    }).setDepth(16);
    this.add.text(W * 0.44 + 20, 28, "Rain Gauge", {
      fontFamily: "'Georgia', serif", fontSize: "19px",
      color: `#${P.textBright.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setDepth(16);
    this._hintTxt = this.add.text(W * 0.44 + 20, 52, "Adjust slider or ← → to change rain intensity.", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`
    }).setDepth(16);
  }

  /* ─────────── KEYS ─────────── */
  _hookKeys() {
    this.input.keyboard.on("keydown-LEFT",  () => { this.rainRate = Phaser.Math.Clamp(this.rainRate - 1, 0, this.maxRainRate); this._redrawSlider(); });
    this.input.keyboard.on("keydown-RIGHT", () => { this.rainRate = Phaser.Math.Clamp(this.rainRate + 1, 0, this.maxRainRate); this._redrawSlider(); });
  }

  /* ─────────── LIGHTNING ─────────── */
  _triggerLightning(W) {
    this._lightning = 8;
    this._lightningX = Phaser.Math.Between(W * 0.15, W * 0.55);
    this._lightningY = Phaser.Math.Between(this._H * 0.05, this._H * 0.2);
  }

  _drawLightning(g) {
    if (this._lightning <= 0) return;
    this._lightning--;
    const x = this._lightningX, y = this._lightningY;

    // Flash sky
    this.skyFlash.setAlpha(this._lightning > 4 ? 0.15 : 0.05);

    // Jagged bolt
    g.lineStyle(3, P.lightningGlow, 0.9);
    let cx = x, cy = y;
    for (let i = 0; i < 6; i++) {
      const nx = cx + Phaser.Math.Between(-18, 18);
      const ny = cy + Phaser.Math.Between(18, 36);
      g.lineBetween(cx, cy, nx, ny);
      cx = nx; cy = ny;
    }
    g.lineStyle(1, P.lightning, 0.6);
    cx = x; cy = y;
    for (let i = 0; i < 6; i++) {
      const nx = cx + Phaser.Math.Between(-12, 12);
      const ny = cy + Phaser.Math.Between(18, 36);
      g.lineBetween(cx, cy, nx, ny);
      cx = nx; cy = ny;
    }
  }

  /* ─────────── UPDATE ─────────── */
  update(time, delta) {
    const dt = delta / 1000;
    this.timeMin += dt * (1/60);

    // Rainfall accumulation
    this.mm = Phaser.Math.Clamp(
      this.mm + this.rainRate * this.fillFactor * dt,
      0, 100
    );
    this._displayMM = Phaser.Math.Linear(this._displayMM, this.mm, 0.08);

    const intensity = this.rainRate / this.maxRainRate;

    // ── Rain ──
    this._updateRain(dt, this._W, this._H);

    // ── Lightning (heavy rain) ──
    const lightningGfx = this.rainGfx;  // reuse layer
    if (this.rainRate >= 8 && Math.random() < 0.003) this._triggerLightning(this._W);
    if (this._lightning > 0) this._drawLightning(this.rainGfx);
    else this.skyFlash.setAlpha(0);

    // ── Clouds (darken + speed with rain) ──
    this._cloudLayers.forEach(({ g, baseX, y, scale, speed, phase }, i) => {
      const t = time * 0.001 * speed;
      g.x = Math.sin(t + phase) * 22;
      // Redraw only when rate changes enough (perf: every 60 frames)
      if (Math.round(time / 200) % 3 === i) {
        this._drawStormCloud(g, baseX, y, scale * (1 + intensity * 0.15));
      }
    });

    // ── Ground wetness ──
    this._redrawPuddles(intensity);
    this.groundSheen.setAlpha(0.04 + intensity * 0.1);

    // ── Gauge ──
    this._redrawWater(this._displayMM);
    this._tickGaugeBubbles(dt, this._displayMM);
    this.gaugeMmLabel.setText(`${this._displayMM.toFixed(1)} mm`);
    const labelColor = this._displayMM > 70 ? "#ff4444" : this._displayMM > 40 ? "#ffaa44" : "#44aaff";
    this.gaugeMmLabel.setColor(labelColor);

    // ── Intensity bar ──
    const ibg = this.intensityBarGfx;
    ibg.clear();
    const filled = Math.round(intensity * this.maxRainRate);
    for (let i = 0; i < filled; i++) {
      const segW = (this._intensityBarW / this.maxRainRate) - 2;
      const segX = this._intensityBarX + i * (this._intensityBarW / this.maxRainRate) + 1;
      const segColor = i < 4 ? 0x2277cc : i < 7 ? 0x2299ee : 0x44bbff;
      ibg.fillStyle(segColor, 1);
      ibg.fillRoundedRect(segX, this._intensityBarY, segW, this._intensityBarH, 3);
    }

    // ── LCD updates ──
    const fillRate = (this.rainRate * this.fillFactor).toFixed(2);
    this._lcdRate.setText(`${this.rainRate} / ${this.maxRainRate}`);
    this._lcdMM.setText(`${this._displayMM.toFixed(1)} mm`);
    this._lcdTime.setText(`${this.timeMin.toFixed(1)} min`);
    this._lcdRate2.setText(`${fillRate} mm/s`);

    // ── Graph ──
    if (Math.round(time / 1000) > this._graphPoints.length * 0.8) {
      this._graphPoints.push(this.mm);
      if (this._graphPoints.length > this._maxGraphPts) this._graphPoints.shift();
      this._drawGraph();
    }

    // ── Hint text ──
    if (this.mm >= 99) {
      this._hintTxt.setText("⚠ Gauge full at 100mm! Reset to continue recording.");
    } else if (this.rainRate === 0) {
      this._hintTxt.setText("No rain. Use slider or → key to start rainfall.");
    } else {
      this._hintTxt.setText(`Collecting at ${fillRate} mm/s  ·  ${this._displayMM.toFixed(1)} mm collected  ·  ${this.timeMin.toFixed(1)} min elapsed`);
    }

    this.emitMeasurement({
      rainRate:    this.rainRate,
      mmCollected: this.mm.toFixed(1),
      timeMin:     this.timeMin.toFixed(1),
    });
  }
}