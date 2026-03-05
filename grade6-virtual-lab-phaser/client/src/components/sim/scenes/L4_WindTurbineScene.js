import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════════
   PALETTE  –  coastal wind farm / clean energy
═══════════════════════════════════════════════════ */
const P = {
  // Sky
  skyTop:        0x0a1a2e,
  skyMid:        0x0f2a4a,
  skyHorizon:    0x1a4a6a,
  skyDawn:       0x2a6a8a,

  // Ocean
  oceanDeep:     0x0a1e30,
  oceanMid:      0x0f2e4a,
  oceanShallow:  0x1a4a6a,
  oceanFoam:     0x4a8aaa,
  wave:          0x2a6a8a,
  waveShine:     0x6aaacc,

  // Land / cliff
  cliff:         0x2a3a2a,
  cliffDark:     0x1a2818,
  grass:         0x3a5a2a,
  grassTip:      0x4a7a3a,

  // Turbine
  towerBase:     0xd0d8e0,
  towerMid:      0xe0e8f0,
  towerTop:      0xf0f4f8,
  towerShadow:   0xa0aab8,
  hubColor:      0xe8f0f8,
  hubRim:        0xb0c0d0,
  bladeColor:    0xf0f4f8,
  bladeShadow:   0xb0bcc8,
  bladeSheen:    0xffffff,
  nacelle:       0xd8e4f0,

  // Wind streaks
  wind1:         0x4a8aff,
  wind2:         0x2a6acc,
  wind3:         0x88bbff,

  // Power panel
  panelBg:       0x060c14,
  panelBorder:   0x1a3a5a,
  panelAccent:   0x00aaff,
  lcdBg:         0x040810,
  lcdOn:         0x00ddff,
  lcdDim:        0x062030,

  // Gauges
  gaugeBg:       0x0a1a28,
  gaugeArc:      0x1a3a5a,
  gaugeLow:      0x2266ff,
  gaugeMid:      0x00aaff,
  gaugeHigh:     0x00ffee,
  gaugeMax:      0xffcc00,

  // Chart
  chartBg:       0x04080f,
  chartLine:     0x00aaff,
  chartFill:     0x002244,
  chartGrid:     0x0a1828,
  chartDot:      0x44ccff,

  // Slider
  sliderTrack:   0x0a1e30,
  sliderFill:    0x0088cc,
  sliderWind:    0x44aaff,

  // Birds
  bird:          0x2a5a8a,

  // Stars
  star:          0x88aacc,

  // Text
  textBright:    0xd0eeff,
  textMid:       0x5a88aa,
  textDim:       0x1a3a5a,
  textGold:      0xffcc44,
  textGreen:     0x44ffaa,
};

export default class L4_WindTurbineScene extends BaseLabScene {
  constructor(opts) {
    super("L4_WindTurbineScene", opts);
    this.windSpeed   = opts.labConfig?.windSpeed ?? 5;
    this.maxWind     = opts.labConfig?.maxWind   ?? 15;
    this.bladeAngle  = 0;
    this.energy      = 0;
    this._displayPower = 0;
    this._rotSpeed   = 0;       // smooth rotation speed
    this._graphPts   = [];
    this._maxGraphPts= 80;
    this._windStreaks = [];
    this._isDragging = false;
    this._birds      = [];
    this._waves      = [];
    this._stars      = [];
  }

  /* ──────────────────────── CREATE ──────────────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._W = W; this._H = H;

    this._buildSky(W, H);
    this._buildStars(W, H);
    this._buildOcean(W, H);
    this._buildCliff(W, H);
    this._buildWindStreaks(W, H);
    this._buildTurbine(W, H);
    this._buildBirds(W, H);
    this._buildPanel(W, H);
    this._buildPowerGauge(W, H);
    this._buildGraph(W, H);
    this._buildSlider(W, H);
    this._buildHeader(W, H);
    this._hookKeys();
  }

  /* ─────────── SKY ─────────── */
  _buildSky(W, H) {
    const hy = H * 0.55;
    this.add.rectangle(W/2, H * 0.14, W, H * 0.28, P.skyTop);
    this.add.rectangle(W/2, H * 0.34, W, H * 0.24, P.skyMid);
    this.add.rectangle(W/2, H * 0.5,  W, H * 0.2,  P.skyHorizon);

    // Subtle horizon glow
    this.horizonGlow = this.add.rectangle(W/2, hy, W, 40, 0x3388aa, 0.0).setAlpha(0.15);
  }

  /* ─────────── STARS ─────────── */
  _buildStars(W, H) {
    this._stars = [];
    const sg = this.add.graphics().setDepth(1);
    for (let i = 0; i < 40; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H * 0.45);
      const r  = Phaser.Math.FloatBetween(0.5, 1.5);
      sg.fillStyle(P.star, Phaser.Math.FloatBetween(0.3, 0.8));
      sg.fillCircle(sx, sy, r);
      this._stars.push({ x: sx, y: sy, r, phase: Math.random() * Math.PI * 2 });
    }
    this._starGfx = sg;
  }

  /* ─────────── OCEAN ─────────── */
  _buildOcean(W, H) {
    const oy = H * 0.55;
    this._oceanY = oy;

    this.add.rectangle(W/2, oy + (H - oy)/2, W, H - oy, P.oceanDeep);
    this.add.rectangle(W/2, oy + 14, W, 28, P.oceanMid);

    this.waveGfx = this.add.graphics().setDepth(4);
    // Init wave offsets
    this._waves = Array.from({ length: 6 }, (_, i) => ({
      y: oy + 8 + i * 12,
      speed: 0.3 + i * 0.08,
      amp: 5 - i * 0.6,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.35 - i * 0.04,
    }));
  }

  _drawOcean(time) {
    const g = this.waveGfx;
    g.clear();
    const W = this._W;
    this._waves.forEach(({ y, speed, amp, phase, alpha }) => {
      g.lineStyle(2, P.waveShine, alpha);
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 8) {
        g.lineTo(x, y + Math.sin(x * 0.018 + time * speed * 0.001 + phase) * amp);
      }
      g.strokePath();
    });
  }

  /* ─────────── CLIFF ─────────── */
  _buildCliff(W, H) {
    const oy  = this._oceanY;
    const cliffH = H * 0.18;

    const g = this.add.graphics().setDepth(5);
    // Cliff body
    g.fillStyle(P.cliff, 1);
    g.fillTriangle(0, oy, W * 0.45, oy, 0, oy + cliffH);
    g.fillRect(0, oy, W * 0.42, cliffH * 0.3);

    // Cliff edge detail
    g.fillStyle(P.cliffDark, 1);
    g.fillTriangle(0, oy - 4, W * 0.44, oy - 4, 0, oy + cliffH * 0.15);

    // Grass layer on top
    g.fillStyle(P.grass, 1);
    g.fillRect(0, oy - 18, W * 0.43, 20);

    // Grass tips
    g.fillStyle(P.grassTip, 1);
    for (let gx = 0; gx < W * 0.42; gx += 14) {
      const gh = 5 + Math.sin(gx * 0.2) * 3;
      g.fillTriangle(gx, oy - 18, gx + 7, oy - 18, gx + 3, oy - 18 - gh);
      g.fillTriangle(gx + 5, oy - 16, gx + 12, oy - 16, gx + 8, oy - 16 - gh + 2);
    }

    this._cliffTopY = oy - 18;
    this._turbineBaseX = W * 0.3;
    this._turbineBaseY = oy - 18;
  }

  /* ─────────── WIND STREAKS ─────────── */
  _buildWindStreaks(W, H) {
    this.windGfx = this.add.graphics().setDepth(3);
    this._windStreaks = Array.from({ length: 18 }, (_, i) => ({
      x: Phaser.Math.FloatBetween(0, W),
      y: Phaser.Math.FloatBetween(H * 0.08, this._oceanY - 20),
      len: Phaser.Math.FloatBetween(40, 100),
      speed: Phaser.Math.FloatBetween(180, 340),
      alpha: Phaser.Math.FloatBetween(0.1, 0.4),
      width: Phaser.Math.FloatBetween(1, 2.5),
      wave: Phaser.Math.FloatBetween(0.005, 0.015),
      phase: Math.random() * Math.PI * 2,
      active: false,
    }));
  }

  _drawWindStreaks(dt, time) {
    const g = this.windGfx;
    g.clear();
    const intensity = this.windSpeed / this.maxWind;
    const activeCount = Math.floor(intensity * this._windStreaks.length);

    this._windStreaks.forEach((s, i) => {
      s.active = i < activeCount;
      if (!s.active) return;

      s.x += s.speed * dt * (0.6 + intensity * 0.4);
      s.y = s.y + Math.sin(time * s.wave + s.phase) * 0.3;
      if (s.x > this._W + s.len) {
        s.x = -s.len;
        s.y = Phaser.Math.FloatBetween(this._H * 0.08, this._oceanY - 20);
      }

      const alpha = s.alpha * (0.5 + intensity * 0.5);
      const col = i % 3 === 0 ? P.wind1 : i % 3 === 1 ? P.wind2 : P.wind3;
      // Taper: thick start, thin end
      g.lineStyle(s.width, col, alpha);
      g.lineBetween(s.x, s.y, s.x + s.len, s.y + Math.sin(time * s.wave + s.phase) * 3);
      g.lineStyle(s.width * 0.4, 0xffffff, alpha * 0.3);
      g.lineBetween(s.x, s.y - 1, s.x + s.len * 0.6, s.y - 1);
    });
  }

  /* ─────────── TURBINE ─────────── */
  _buildTurbine(W, H) {
    const tx = this._turbineBaseX;
    const ty = this._turbineBaseY;
    const towerH = 160;
    const hubY   = ty - towerH;

    this._hubX = tx;
    this._hubY = hubY;

    const g = this.add.graphics().setDepth(6);

    // Tower shadow
    g.fillStyle(0x000000, 0.2);
    g.fillTriangle(tx + 3, ty + 4, tx + 20, ty + 4, tx + 10, hubY + 4);

    // Tower (tapered)
    g.fillStyle(P.towerShadow, 1);
    g.fillTriangle(tx + 2, ty, tx + 18, ty, tx + 10, hubY);
    g.fillStyle(P.towerMid, 1);
    g.fillTriangle(tx - 12, ty, tx + 12, ty, tx - 4, hubY);
    g.fillStyle(P.towerTop, 1);
    g.fillTriangle(tx - 13, ty, tx + 1, ty, tx - 5, hubY);
    // Tower sheen
    g.fillStyle(0xffffff, 0.12);
    g.fillTriangle(tx - 13, ty, tx - 10, ty, tx - 6, hubY);

    // Base foundation
    g.fillStyle(P.towerShadow, 1);
    g.fillRoundedRect(tx - 22, ty - 6, 44, 16, 4);
    g.fillStyle(P.towerMid, 1);
    g.fillRoundedRect(tx - 24, ty - 8, 44, 14, 4);

    // Nacelle (housing at top)
    g.fillStyle(P.nacelle, 1);
    g.fillRoundedRect(tx - 22, hubY - 14, 44, 22, 8);
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(tx - 20, hubY - 12, 20, 8, 4);
    g.lineStyle(1.5, P.hubRim, 0.7);
    g.strokeRoundedRect(tx - 22, hubY - 14, 44, 22, 8);

    // Hub centre (drawn separately for glow update)
    this.hubGfx = this.add.graphics().setDepth(8);
    this._redrawHub(0);

    // Single graphics object for all three blades
    this.bladeGfx = [ this.add.graphics().setDepth(7) ];
    this._updateBlades(0);

    // Glow halo around hub
    this.hubGlow = this.add.circle(tx, hubY, 38, P.panelAccent, 0).setDepth(6).setAlpha(0);
  }

  _redrawHub(glow) {
    const g = this.hubGfx;
    g.clear();
    const cx = this._hubX, cy = this._hubY;
    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0xe8, g: 0xf0, b: 0xf8 },
      { r: 0xff, g: 0xcc, b: 0x44 },
      100, Math.round(glow * 100)
    );
    const hubCol = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
    g.fillStyle(hubCol, 1);
    g.fillCircle(cx, cy, 14);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(cx - 4, cy - 4, 5);
    g.lineStyle(2, P.hubRim, 1);
    g.strokeCircle(cx, cy, 14);
    g.fillStyle(P.panelBg, 1);
    g.fillCircle(cx, cy, 5);
    g.lineStyle(1.5, P.hubRim, 0.6);
    g.strokeCircle(cx, cy, 5);
  }

  _drawBlade(g, cx, cy, angleRad) {
    // Draw a single tapered blade pointing in angleRad direction
    const bladeLen = 80;
    const rootDist = 16;   // start past hub centre
    const rootHalfW = 9;   // half-width at root
    const tipHalfW  = 2;   // half-width at tip

    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    // perpendicular (left-normal)
    const px = -sin, py = cos;

    const rx = cx + cos * rootDist;
    const ry = cy + sin * rootDist;
    const tx = cx + cos * (rootDist + bladeLen);
    const ty = cy + sin * (rootDist + bladeLen);

    // Four corners of tapered blade
    const x0 = rx + px * rootHalfW,  y0 = ry + py * rootHalfW;
    const x1 = rx - px * rootHalfW,  y1 = ry - py * rootHalfW;
    const x2 = tx - px * tipHalfW,   y2 = ty - py * tipHalfW;
    const x3 = tx + px * tipHalfW,   y3 = ty + py * tipHalfW;

    // Main blade body
    g.fillStyle(P.bladeColor, 1);
    g.fillTriangle(x0, y0, x1, y1, x2, y2);
    g.fillTriangle(x0, y0, x2, y2, x3, y3);

    // Shadow half (trailing edge)
    g.fillStyle(P.bladeShadow, 0.45);
    g.fillTriangle(x1, y1, x2, y2,
      rx - px * rootHalfW * 0.3, ry - py * rootHalfW * 0.3);

    // Leading-edge sheen line
    g.lineStyle(1.5, P.bladeSheen, 0.3);
    g.lineBetween(x0, y0, x3, y3);

    // Outline
    g.lineStyle(1, P.towerShadow, 0.35);
    g.lineBetween(x0, y0, x3, y3);
    g.lineBetween(x1, y1, x2, y2);
  }

  _updateBlades(angleDeg) {
    // Draw all three blades into a single graphics object for efficiency
    const g = this.bladeGfx[0];
    g.clear();
    const baseRad = Phaser.Math.DegToRad(angleDeg);
    for (let i = 0; i < 3; i++) {
      this._drawBlade(g, this._hubX, this._hubY, baseRad + (i / 3) * Math.PI * 2);
    }
  }

  /* ─────────── BIRDS ─────────── */
  _buildBirds(W, H) {
    this.birdGfx = this.add.graphics().setDepth(12);
    this._birds = Array.from({ length: 5 }, (_, i) => ({
      x: Phaser.Math.FloatBetween(0, W),
      y: Phaser.Math.FloatBetween(H * 0.1, H * 0.45),
      speed: Phaser.Math.FloatBetween(28, 55),
      flapPhase: Math.random() * Math.PI * 2,
      scale: Phaser.Math.FloatBetween(0.6, 1.2),
    }));
  }

  _drawBirds(dt, time) {
    const g = this.birdGfx;
    g.clear();
    const intensity = this.windSpeed / this.maxWind;
    g.lineStyle(1.5, P.bird, 0.7);
    this._birds.forEach(b => {
      b.x += b.speed * dt * (0.5 + intensity * 0.5);
      if (b.x > this._W + 30) { b.x = -30; b.y = Phaser.Math.FloatBetween(this._H * 0.1, this._H * 0.45); }
      const flap = Math.sin(time * 0.005 * b.speed + b.flapPhase) * 5 * b.scale;
      // Simple M-shape bird
      g.beginPath();
      g.moveTo(b.x - 8 * b.scale, b.y - flap);
      g.lineTo(b.x, b.y);
      g.lineTo(b.x + 8 * b.scale, b.y - flap);
      g.strokePath();
    });
  }

  /* ─────────── INSTRUMENT PANEL ─────────── */
  _buildPanel(W, H) {
    const px = W * 0.52, py = 68;
    const pw = W - px - 14, ph = H * 0.56;

    this._panelX = px; this._panelY = py;
    this._panelW = pw; this._panelH = ph;

    const pg = this.add.graphics().setDepth(10);
    pg.fillStyle(0x000000, 0.4);
    pg.fillRoundedRect(px + 4, py + 5, pw, ph, 12);
    pg.fillStyle(P.panelBg, 1);
    pg.fillRoundedRect(px, py, pw, ph, 12);
    pg.lineStyle(2, P.panelBorder, 1);
    pg.strokeRoundedRect(px, py, pw, ph, 12);
    pg.fillStyle(P.panelAccent, 1);
    pg.fillRoundedRect(px, py, pw, 5, { tl: 12, tr: 12, bl: 0, br: 0 });

    const cx = px + pw/2;
    this.add.text(cx, py + 18, "TURBINE MONITOR", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 3
    }).setOrigin(0.5).setDepth(11);

    const lcdRow = (label, yy, ghost) => {
      const lh = 30, lx = px + 10, lw = pw - 20;
      const lg = this.add.graphics().setDepth(11);
      lg.fillStyle(P.lcdBg, 1);
      lg.fillRoundedRect(lx, yy, lw, lh, 5);
      lg.lineStyle(1, P.panelBorder, 0.8);
      lg.strokeRoundedRect(lx, yy, lw, lh, 5);
      this.add.text(lx + 5, yy + 4, label, {
        fontFamily: "'Courier New', monospace", fontSize: "8px",
        color: `#${P.lcdDim.toString(16).padStart(6,"0")}`, letterSpacing: 1
      }).setDepth(12);
      if (ghost) {
        this.add.text(lx + lw - 5, yy + lh/2, ghost, {
          fontFamily: "'Courier New', monospace", fontSize: "14px",
          color: `#${P.lcdDim.toString(16).padStart(6,"0")}`
        }).setOrigin(1, 0.5).setDepth(12);
      }
      return this.add.text(lx + lw - 5, yy + lh/2, "—", {
        fontFamily: "'Courier New', monospace", fontSize: "14px",
        color: `#${P.lcdOn.toString(16).padStart(6,"0")}`
      }).setOrigin(1, 0.5).setDepth(13);
    };

    let ry = py + 32;
    this._lcdWind   = lcdRow("WIND SPEED (m/s)", ry, "00.0"); ry += 36;
    this._lcdPower  = lcdRow("POWER OUTPUT (W)", ry, "0000"); ry += 36;
    this._lcdRPM    = lcdRow("ROTOR SPEED (RPM)",ry, "000");  ry += 36;
    this._lcdEnergy = lcdRow("TOTAL ENERGY (J)", ry, "00000");ry += 40;

    // Turbine status badge
    this._statusBadge = this.add.text(cx, ry, "● IDLE", {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, align: "center"
    }).setOrigin(0.5).setDepth(12);
    ry += 20;

    // Beaufort scale label
    this._beaufortLabel = this.add.text(cx, ry, "Calm", {
      fontFamily: "'Georgia', serif", fontSize: "13px",
      color: `#${P.textMid.toString(16).padStart(6,"0")}`, align: "center", fontStyle: "italic"
    }).setOrigin(0.5).setDepth(12);
  }

  /* ─────────── POWER GAUGE ─────────── */
  _buildPowerGauge(W, H) {
    const cx = this._panelX + this._panelW / 2;
    const cy = this._panelY + this._panelH + 62;
    this._gaugeCX = cx; this._gaugeCY = cy;
    this._gaugeR  = 48;

    // Gauge panel background
    const pw = this._panelW, px = this._panelX;
    const gh = 112;
    const gy = this._panelY + this._panelH + 6;

    const gbg = this.add.graphics().setDepth(10);
    gbg.fillStyle(P.gaugeBg, 1);
    gbg.fillRoundedRect(px, gy, pw, gh, 8);
    gbg.lineStyle(1.5, P.panelBorder, 1);
    gbg.strokeRoundedRect(px, gy, pw, gh, 8);

    this.add.text(cx, gy + 12, "POWER GAUGE", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(11);

    // Background arc
    const arcBg = this.add.graphics().setDepth(11);
    arcBg.lineStyle(12, P.gaugeArc, 1);
    arcBg.beginPath();
    arcBg.arc(cx, cy, this._gaugeR, Math.PI * 0.8, Math.PI * 2.2, false);
    arcBg.strokePath();

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = Math.PI * 0.8 + (i / 10) * Math.PI * 1.4;
      const ir = this._gaugeR - 8, or = this._gaugeR + (i % 5 === 0 ? 8 : 5);
      arcBg.lineStyle(i % 5 === 0 ? 2 : 1, P.textMid, i % 5 === 0 ? 0.8 : 0.4);
      arcBg.lineBetween(cx + Math.cos(angle) * ir, cy + Math.sin(angle) * ir,
                        cx + Math.cos(angle) * or, cy + Math.sin(angle) * or);
      if (i % 5 === 0) {
        const maxPwr = Math.round((this.maxWind * this.maxWind) / 4);
        this.add.text(cx + Math.cos(angle) * (or + 10), cy + Math.sin(angle) * (or + 10),
          `${Math.round(i / 10 * maxPwr)}`,
          { fontFamily: "'Courier New', monospace", fontSize: "9px", color: `#${P.textDim.toString(16).padStart(6,"0")}` }
        ).setOrigin(0.5).setDepth(12);
      }
    }

    // W label
    this.add.text(cx, cy + 20, "W", {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`
    }).setOrigin(0.5).setDepth(12);

    this.gaugeArcGfx   = this.add.graphics().setDepth(12);
    this.gaugeNeedle   = this.add.graphics().setDepth(13);
    this.gaugePwrLabel = this.add.text(cx, cy - 8, "0 W", {
      fontFamily: "'Georgia', serif", fontSize: "15px",
      color: `#${P.lcdOn.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setOrigin(0.5).setDepth(13);
    this._needleAngle  = Math.PI * 0.8;
  }

  _updateGauge(power) {
    const maxPwr = (this.maxWind * this.maxWind) / 4;
    const pct    = Phaser.Math.Clamp(power / maxPwr, 0, 1);
    const cx = this._gaugeCX, cy = this._gaugeCY, r = this._gaugeR;

    const targetAngle = Math.PI * 0.8 + pct * Math.PI * 1.4;
    this._needleAngle = Phaser.Math.Linear(this._needleAngle, targetAngle, 0.1);

    // Colour arc
    const g = this.gaugeArcGfx;
    g.clear();
    if (pct > 0.01) {
      const col = pct < 0.4 ? P.gaugeLow : pct < 0.7 ? P.gaugeMid : pct < 0.9 ? P.gaugeHigh : P.gaugeMax;
      g.lineStyle(12, col, 0.85);
      g.beginPath();
      g.arc(cx, cy, r, Math.PI * 0.8, this._needleAngle, false);
      g.strokePath();
    }

    // Needle
    const ng = this.gaugeNeedle;
    ng.clear();
    ng.lineStyle(2.5, 0xffffff, 0.95);
    ng.lineBetween(cx, cy,
      cx + Math.cos(this._needleAngle) * (r - 6),
      cy + Math.sin(this._needleAngle) * (r - 6));
    ng.fillStyle(0xffffff, 1);
    ng.fillCircle(cx, cy, 5);
    ng.fillStyle(P.panelBg, 1);
    ng.fillCircle(cx, cy, 3);

    this.gaugePwrLabel.setText(`${Math.round(power)} W`);
    const labelColor = pct < 0.4 ? P.gaugeLow : pct < 0.7 ? P.gaugeMid : P.gaugeMax;
    this.gaugePwrLabel.setColor(`#${labelColor.toString(16).padStart(6,"0")}`);
  }

  /* ─────────── GRAPH ─────────── */
  _buildGraph(W, H) {
    const gx = this._panelX;
    const gy = this._panelY + this._panelH + 125;
    const gw = this._panelW;
    const gh = H - gy - 58;

    this._graphX = gx; this._graphY = gy;
    this._graphW = gw; this._graphH = gh;

    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(P.chartBg, 1);
    bg.fillRoundedRect(gx, gy, gw, gh, 8);
    bg.lineStyle(1.5, P.panelBorder, 1);
    bg.strokeRoundedRect(gx, gy, gw, gh, 8);
    bg.lineStyle(1, P.chartGrid, 1);
    for (let i = 1; i < 4; i++) bg.lineBetween(gx + 8, gy + (gh/4)*i, gx + gw - 8, gy + (gh/4)*i);

    this.add.text(gx + gw/2, gy + 8, "POWER HISTORY", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(11);

    this.graphGfx = this.add.graphics().setDepth(11);
  }

  _drawGraph() {
    const g = this.graphGfx;
    g.clear();
    const pts = this._graphPts;
    if (pts.length < 2) return;
    const { _graphX: gx, _graphY: gy, _graphW: gw, _graphH: gh } = this;
    const pad = 12;
    const maxPwr = (this.maxWind * this.maxWind) / 4;
    const toX = (i)  => gx + pad + (i / (this._maxGraphPts - 1)) * (gw - pad * 2);
    const toY = (val) => gy + gh - pad - (val / maxPwr) * (gh - pad * 2);

    // Fill
    g.fillStyle(P.chartFill, 0.5);
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
    g.fillStyle(P.chartDot, 1);
    g.fillCircle(toX(pts.length - 1), toY(pts[pts.length - 1]), 3);
  }

  /* ─────────── SLIDER ─────────── */
  _buildSlider(W, H) {
    const py = H - 50, px = 18;
    const pw = W * 0.46, sw = pw - 50;
    const sx = px + 28;

    this._sliderPY = py; this._sliderSX = sx; this._sliderSW = sw;

    const sbg = this.add.graphics().setDepth(10);
    sbg.fillStyle(P.panelBg, 0.92);
    sbg.fillRoundedRect(px, py - 20, pw, 42, 8);
    sbg.lineStyle(1.5, P.panelBorder, 1);
    sbg.strokeRoundedRect(px, py - 20, pw, 42, 8);

    this.add.text(px + 10, py, "🍃", { fontSize: "16px" }).setOrigin(0, 0.5).setDepth(11);
    this.add.text(px + pw - 10, py, "💨", { fontSize: "16px" }).setOrigin(1, 0.5).setDepth(11);

    const track = this.add.graphics().setDepth(11);
    track.fillStyle(P.sliderTrack, 1);
    track.fillRoundedRect(sx, py - 5, sw, 10, 4);

    this.sliderFillGfx  = this.add.graphics().setDepth(12);
    this.sliderThumbGfx = this.add.graphics().setDepth(13);
    this.sliderLabel    = this.add.text(px + pw + 14, py, "", {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: `#${P.lcdOn.toString(16).padStart(6,"0")}`
    }).setOrigin(0, 0.5).setDepth(12);

    this._redrawSlider();

    const hit = this.add.rectangle(px + pw/2, py, pw, 36, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true }).setDepth(14);
    hit.on("pointerdown",  (p) => { this._isDragging = true; this._updateSlider(p); });
    this.input.on("pointermove", (p) => { if (this._isDragging) this._updateSlider(p); });
    this.input.on("pointerup",   () => { this._isDragging = false; });
  }

  _updateSlider(p) {
    const rx = Phaser.Math.Clamp(p.x - this._sliderSX, 0, this._sliderSW);
    this.windSpeed = Math.round((rx / this._sliderSW) * this.maxWind);
    this._redrawSlider();
  }

  _redrawSlider() {
    const g = this.sliderFillGfx, tg = this.sliderThumbGfx;
    g.clear(); tg.clear();
    const { _sliderPY: py, _sliderSX: sx, _sliderSW: sw } = this;
    const pct = this.windSpeed / this.maxWind;

    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x22, g: 0x66, b: 0xcc },
      { r: 0x44, g: 0xcc, b: 0xff },
      100, Math.round(pct * 100)
    );
    const fillCol = Phaser.Display.Color.GetColor(col.r, col.g, col.b);

    g.fillStyle(fillCol, 1);
    g.fillRoundedRect(sx, py - 5, sw * pct, 10, 4);

    const thumbX = sx + sw * pct;
    tg.fillStyle(P.sliderThumb, 1);
    tg.fillCircle(thumbX, py, 12);
    tg.lineStyle(2.5, fillCol, 1);
    tg.strokeCircle(thumbX, py, 12);
    tg.fillStyle(fillCol, 1);
    tg.fillCircle(thumbX, py, 5);

    this.sliderLabel?.setText(`${this.windSpeed} m/s`);
  }

  /* ─────────── HEADER ─────────── */
  _buildHeader(W, H) {
    const hg = this.add.graphics().setDepth(15);
    const hw = W * 0.48, hx = 14;
    hg.fillStyle(P.panelBg, 0.9);
    hg.fillRoundedRect(hx, 6, hw, 56, 8);
    hg.lineStyle(1.5, P.panelBorder, 1);
    hg.strokeRoundedRect(hx, 6, hw, 56, 8);
    hg.fillStyle(P.panelAccent, 1);
    hg.fillRect(hx, 6, 4, 56);

    this.add.text(hx + 14, 12, "LAB 04", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 3
    }).setDepth(16);
    this.add.text(hx + 14, 28, "Wind Turbine Power", {
      fontFamily: "'Georgia', serif", fontSize: "19px",
      color: `#${P.textBright.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setDepth(16);
    this._hintTxt = this.add.text(hx + 14, 52, "Drag slider or ← → to change wind speed.", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`
    }).setDepth(16);
  }

  /* ─────────── KEYS ─────────── */
  _hookKeys() {
    this.input.keyboard.on("keydown-LEFT",  () => { this.windSpeed = Phaser.Math.Clamp(this.windSpeed - 1, 0, this.maxWind); this._redrawSlider(); });
    this.input.keyboard.on("keydown-RIGHT", () => { this.windSpeed = Phaser.Math.Clamp(this.windSpeed + 1, 0, this.maxWind); this._redrawSlider(); });
  }

  /* ─────────── BEAUFORT SCALE ─────────── */
  _beaufort(v) {
    if (v === 0)      return "Calm";
    if (v <= 1)       return "Light Air";
    if (v <= 3)       return "Light Breeze";
    if (v <= 5)       return "Gentle Breeze";
    if (v <= 7)       return "Moderate Breeze";
    if (v <= 9)       return "Fresh Breeze";
    if (v <= 11)      return "Strong Breeze";
    if (v <= 13)      return "Near Gale";
    return "Gale";
  }

  /* ─────────── UPDATE ─────────── */
  update(time, delta) {
    const dt = delta / 1000;
    const intensity = this.windSpeed / this.maxWind;

    // Smooth rotation speed
    const targetRot = this.windSpeed * 2.8;
    this._rotSpeed = Phaser.Math.Linear(this._rotSpeed, targetRot, 0.05);
    this.bladeAngle += this._rotSpeed * dt;

    // Blades
    this._updateBlades(this.bladeAngle);

    // Hub glow
    const glow = intensity;
    this._redrawHub(glow);
    this.hubGlow.setAlpha(glow * 0.35);
    this.hubGlow.setScale(1 + Math.sin(time * 0.003) * 0.08 * glow);

    // Power (cube law capped)
    const power = Math.round((this.windSpeed * this.windSpeed) / 4);
    this._displayPower = Phaser.Math.Linear(this._displayPower, power, 0.07);
    this.energy += this._displayPower * dt;

    // RPM
    const rpm = Math.round(this._rotSpeed * 60 / 360);

    // ── Environment ──
    this._drawOcean(time);
    this._drawWindStreaks(dt, time);
    this._drawBirds(dt, time);

    // Horizon glow brightens with wind
    this.horizonGlow.setAlpha(0.1 + intensity * 0.2);

    // ── Gauge ──
    this._updateGauge(this._displayPower);

    // ── Graph ──
    if (Math.floor(time / 800) > (this._lastGraphTick ?? -1)) {
      this._lastGraphTick = Math.floor(time / 800);
      this._graphPts.push(this._displayPower);
      if (this._graphPts.length > this._maxGraphPts) this._graphPts.shift();
      this._drawGraph();
    }

    // ── LCD ──
    this._lcdWind.setText(`${this.windSpeed.toFixed(1)} m/s`);
    this._lcdPower.setText(`${Math.round(this._displayPower)} W`);
    this._lcdRPM.setText(`${rpm} RPM`);
    this._lcdEnergy.setText(`${this.energy.toFixed(0)} J`);

    // Status badge
    const statusText = this.windSpeed === 0 ? "● IDLE"
      : intensity < 0.4 ? "● LOW WIND"
      : intensity < 0.75 ? "● GENERATING"
      : "● MAX OUTPUT";
    const statusColor = this.windSpeed === 0 ? P.textDim
      : intensity < 0.4 ? P.gaugeLow
      : intensity < 0.75 ? P.gaugeMid
      : P.gaugeMax;
    this._statusBadge.setText(statusText).setColor(`#${statusColor.toString(16).padStart(6,"0")}`);
    this._beaufortLabel.setText(this._beaufort(this.windSpeed));

    // Hint
    if (this.windSpeed === 0) {
      this._hintTxt.setText("No wind — turbine idle. Use → or slider to add wind.");
    } else if (this.windSpeed >= this.maxWind - 1) {
      this._hintTxt.setText(`⚡ Maximum wind! ${Math.round(this._displayPower)} W output · ${this.energy.toFixed(0)} J total`);
    } else {
      this._hintTxt.setText(`${this.windSpeed} m/s · ${Math.round(this._displayPower)} W · ${this._beaufort(this.windSpeed)} · ${this.energy.toFixed(0)} J`);
    }

    this.emitMeasurement({
      windSpeed:   this.windSpeed,
      power:       Math.round(this._displayPower),
      rpm,
      totalEnergy: this.energy.toFixed(0),
    });
  }
}