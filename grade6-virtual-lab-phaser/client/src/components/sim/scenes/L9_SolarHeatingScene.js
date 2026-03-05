import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════════
   PALETTE  –  bright outdoor / solar science
═══════════════════════════════════════════════════ */
const P = {
  // Sky gradient layers
  skyTop:        0x1a6fa8,
  skyMid:        0x5aafe0,
  skyHorizon:    0xb8dff5,
  ground:        0x7ab648,
  groundDark:    0x4a8a28,
  groundShadow:  0x3a6a18,

  // Sun
  sunCore:       0xfff176,
  sunMid:        0xffee44,
  sunHot:        0xffcc00,
  sunGlow:       0xffee88,
  rayColor:      0xffee44,

  // Clouds
  cloud:         0xffffff,

  // Solar panel
  panelFrame:    0x2a3a4a,
  panelFrameEdge:0x4a6a80,
  panelGlass:    0x1a3a6a,
  panelCell:     0x1e4878,
  panelCellLine: 0x2a5a90,
  panelSheen:    0xaaccee,
  panelMount:    0x3a2a1a,

  // Pipe / tubing
  pipeOuter:     0x222222,
  pipeInner:     0x1a1a1a,
  pipeFit:       0x555555,
  pipeHot:       0xff4422,

  // Water tank
  tankBody:      0xd0e8f8,
  tankBodyDark:  0xa0c0e0,
  tankMetal:     0x8aaccc,
  tankInsul:     0xf0d080,
  tankInsulDark: 0xd0a840,
  waterCold:     0x4488dd,
  waterWarm:     0xff8844,
  waterHot:      0xff3300,

  // Thermometer
  thermoBg:      0xffffff,
  thermoGlass:   0xe8f4ff,
  thermoBorder:  0xb0c8e0,
  thermoBulb:    0xff3344,
  thermoFill:    0xff4455,
  thermoTick:    0x5588aa,
  thermoText:    0x2a4a68,

  // Graph
  graphBg:       0xfafcff,
  graphGrid:     0xe0eaf5,
  graphLine:     0xff6644,
  graphDot:      0xff3322,
  graphAxis:     0x8aaac0,

  // Panel UI
  panelBg:       0x1a2a3a,
  panelBorder:   0x2a4a6a,
  panelAccent:   0xffcc00,
  lcdBg:         0x0a1408,
  lcdOn:         0x88ff44,
  lcdDim:        0x1a3008,

  // Slider
  sliderTrack:   0x1a3a5a,
  sliderFill:    0xffcc00,
  sliderThumb:   0xffffff,

  // Text
  textBright:    0xffffff,
  textDark:      0x1a2a3a,
  textMid:       0x5a8aaa,
  textWarm:      0xff8844,
  textHot:       0xff3322,
};

/* ═══════════════════════════════════════════════════
   SCENE
═══════════════════════════════════════════════════ */
export default class L9_SolarHeatingScene extends BaseLabScene {
  constructor(opts) {
    super("L9_SolarHeatingScene", opts);
    this.startTemp  = opts.labConfig?.startTemp  ?? 28;
    this.temp       = this.startTemp;
    this.sun        = opts.labConfig?.sun        ?? 50;
    this.heatRate   = opts.labConfig?.heatRate   ?? 0.06;
    this.timeMin    = 0;

    // Graph data
    this._graphPoints = [];
    this._maxGraphPoints = 60;

    // Animated values
    this._displayTemp = this.startTemp;
    this._sunriseAnim = 0;   // 0→1 intro animation
    this._lastDust    = 0;
    this._waterBubbles = [];
    this._isDraggingSlider = false;
  }

  /* ──────────────────────────── CREATE ──────────────────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._W = W; this._H = H;

    this._buildSky(W, H);
    this._buildGround(W, H);
    this._buildClouds(W, H);
    this._buildSun(W, H);
    this._buildSolarPanel(W, H);
    this._buildPipework(W, H);
    this._buildWaterTank(W, H);
    this._buildThermometer(W, H);
    this._buildReadoutPanel(W, H);
    this._buildGraph(W, H);
    this._buildSlider(W, H);
    this._buildHeader(W, H);
    this._hookKeys(W, H);

    // Intro animation
    this.tweens.addCounter({
      from: 0, to: 1, duration: 1200, ease: "Sine.Out",
      onUpdate: (tw) => { this._sunriseAnim = tw.getValue(); }
    });
  }

  /* ─────────── SKY ─────────── */
  _buildSky(W, H) {
    // Three layered sky rects for gradient feel
    this.add.rectangle(W/2, H * 0.12, W, H * 0.24, P.skyTop);
    this.add.rectangle(W/2, H * 0.3,  W, H * 0.24, P.skyMid);
    this.add.rectangle(W/2, H * 0.48, W, H * 0.24, P.skyHorizon);

    // Sky glow layer (will tint with sun intensity)
    this.skyGlow = this.add.rectangle(W/2, H * 0.3, W, H * 0.6, 0xffee88, 0)
      .setAlpha(0);
  }

  /* ─────────── GROUND ─────────── */
  _buildGround(W, H) {
    const gy = H * 0.62;
    this.add.rectangle(W/2, gy + (H - gy)/2, W, H - gy, P.ground);
    // Ground shadow strip
    this.add.rectangle(W/2, gy + 6, W, 12, P.groundDark);

    // Grass tufts
    const tg = this.add.graphics();
    tg.fillStyle(P.groundDark, 1);
    for (let gx = 20; gx < W; gx += 28) {
      const h = 5 + Math.sin(gx * 0.3) * 3;
      tg.fillTriangle(gx - 4, gy, gx + 4, gy, gx, gy - h);
      tg.fillTriangle(gx + 8, gy, gx + 16, gy, gx + 12, gy - h + 2);
    }

    this._groundY = gy;
  }

  /* ─────────── CLOUDS ─────────── */
  _buildClouds(W, H) {
    this._clouds = [];
    const cloudData = [
      { x: W * 0.55, y: H * 0.1,  scale: 0.9, speed: 0.12 },
      { x: W * 0.75, y: H * 0.17, scale: 0.65, speed: 0.08 },
      { x: W * 0.2,  y: H * 0.13, scale: 0.5,  speed: 0.15 },
    ];
    cloudData.forEach(({ x, y, scale, speed }) => {
      const g = this.add.graphics();
      this._drawCloud(g, 0, 0, scale);
      g.x = x; g.y = y;
      this._clouds.push({ g, baseX: x, speed });
    });
  }

  _drawCloud(g, x, y, scale) {
    g.clear();
    g.fillStyle(P.cloud, 0.88);
    [[0,0,22],[-24,8,18],[24,8,18],[-12,12,16],[12,12,16],[0,12,18]].forEach(([dx,dy,r]) =>
      g.fillCircle(x + dx * scale, y + dy * scale, r * scale)
    );
  }

  /* ─────────── SUN ─────────── */
  _buildSun(W, H) {
    this._sunX = W * 0.13;
    this._sunBaseY = H * 0.13;

    // Outer glow halos
    this.sunHalo2 = this.add.circle(this._sunX, this._sunBaseY, 70, P.sunGlow, 0.1);
    this.sunHalo1 = this.add.circle(this._sunX, this._sunBaseY, 54, P.sunGlow, 0.2);

    // Ray graphics
    this.rayGfx = this.add.graphics();

    // Sun body
    this.sunOuter = this.add.circle(this._sunX, this._sunBaseY, 38, P.sunMid, 1);
    this.sunCore  = this.add.circle(this._sunX, this._sunBaseY, 28, P.sunCore, 1);
    this.sunSheen = this.add.circle(this._sunX - 10, this._sunBaseY - 10, 10, 0xffffff, 0.35);
  }

  _drawRays(time) {
    const g = this.rayGfx;
    g.clear();
    const sx = this._sunX, sy = this._sunY ?? this._sunBaseY;
    const intensity = this.sun / 100;
    const count = 12;

    for (let i = 0; i < count; i++) {
      const baseAngle = (Math.PI * 2 * i) / count;
      const a = baseAngle + time * 0.0007;
      const wobble = Math.sin(time * 0.002 + i * 0.8) * 6;
      const len = 18 + wobble + intensity * 22;
      const innerR = 42;

      // Main ray
      g.lineStyle(2.5 + intensity * 1.5, P.rayColor, 0.25 + intensity * 0.45);
      g.lineBetween(
        sx + Math.cos(a) * innerR, sy + Math.sin(a) * innerR,
        sx + Math.cos(a) * (innerR + len), sy + Math.sin(a) * (innerR + len)
      );
      // Short secondary ray between main rays
      if (i % 2 === 0) {
        const a2 = a + Math.PI / count;
        g.lineStyle(1.5, P.rayColor, 0.15 + intensity * 0.2);
        g.lineBetween(
          sx + Math.cos(a2) * innerR, sy + Math.sin(a2) * innerR,
          sx + Math.cos(a2) * (innerR + len * 0.55), sy + Math.sin(a2) * (innerR + len * 0.55)
        );
      }
    }

    // Heat beam toward panel
    const panelX = 280, panelY = this._groundY - 90;
    const beamAlpha = intensity * 0.18;
    if (beamAlpha > 0.02) {
      for (let b = 0; b < 3; b++) {
        g.lineStyle(2, P.rayColor, beamAlpha * (1 - b * 0.3));
        g.lineBetween(sx + b * 6, sy + 20, panelX - b * 4, panelY);
      }
    }
  }

  /* ─────────── SOLAR PANEL ─────────── */
  _buildSolarPanel(W, H) {
    const px = W * 0.26, py = this._groundY - 130;
    const pw = 210, ph = 130;
    const tiltAngle = -0.22;   // radians, slight south-facing tilt

    this._panelCX = px; this._panelCY = py;

    const g = this.add.graphics();

    // Mount legs
    g.lineStyle(10, P.panelMount, 1);
    g.lineBetween(px - 60, py + ph * 0.5, px - 60, this._groundY + 2);
    g.lineBetween(px + 60, py + ph * 0.5, px + 60, this._groundY + 2);
    g.fillStyle(P.panelMount, 1);
    g.fillRect(px - 80, this._groundY - 4, 40, 8);
    g.fillRect(px + 40, this._groundY - 4, 40, 8);

    // Panel outer frame shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRoundedRect(px - pw/2 + 4, py - ph/2 + 6, pw, ph, 6);

    // Panel frame
    g.fillStyle(P.panelFrame, 1);
    g.fillRoundedRect(px - pw/2, py - ph/2, pw, ph, 6);
    g.lineStyle(2, P.panelFrameEdge, 1);
    g.strokeRoundedRect(px - pw/2, py - ph/2, pw, ph, 6);

    // Glass area
    g.fillStyle(P.panelGlass, 1);
    g.fillRoundedRect(px - pw/2 + 8, py - ph/2 + 8, pw - 16, ph - 16, 4);

    // PV cells (3×4 grid)
    const cols = 4, rows = 3;
    const cw = (pw - 24) / cols - 3, ch = (ph - 24) / rows - 3;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx_ = px - pw/2 + 12 + col * (cw + 3);
        const cy_ = py - ph/2 + 12 + row * (ch + 3);
        g.fillStyle(P.panelCell, 1);
        g.fillRoundedRect(cx_, cy_, cw, ch, 2);
        // Cell grid lines
        g.lineStyle(0.5, P.panelCellLine, 0.6);
        g.lineBetween(cx_ + cw/2, cy_, cx_ + cw/2, cy_ + ch);
        g.lineBetween(cx_, cy_ + ch/2, cx_ + cw, cy_ + ch/2);
      }
    }

    // Sheen overlay
    this.panelSheenGfx = this.add.graphics();
    this._updatePanelSheen(0);

    // Glow overlay (brightens with sun)
    this.panelGlowGfx = this.add.graphics();
  }

  _updatePanelSheen(time) {
    const g = this.panelSheenGfx;
    g.clear();
    const px = this._panelCX, py = this._panelCY;
    const pw = 210, ph = 130;
    const shift = (Math.sin(time * 0.0004) + 1) / 2;
    g.fillStyle(P.panelSheen, 0.07 + shift * 0.06);
    g.fillRoundedRect(px - pw/2 + 8 + shift * 30, py - ph/2 + 8, (pw - 16) * 0.4, ph - 16, 4);
  }

  /* ─────────── PIPEWORK ─────────── */
  _buildPipework(W, H) {
    const panelX = this._panelCX, panelY = this._panelCY;
    const tankX = W * 0.52, tankY = this._groundY - 70;

    this.pipeGfx = this.add.graphics();
    this._pipeFromX = panelX + 105;
    this._pipeFromY = panelY + 20;
    this._pipeToX = tankX - 55;
    this._pipeToY = tankY - 30;
    this._redrawPipes(0);

    // Flow particles along pipe
    this._pipeParticles = [];
  }

  _redrawPipes(warmth) {
    const g = this.pipeGfx;
    g.clear();
    const { _pipeFromX: fx, _pipeFromY: fy, _pipeToX: tx, _pipeToY: ty } = this;

    const pipeColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x22, g: 0x22, b: 0x22 },
      { r: 0xff, g: 0x44, b: 0x22 },
      100, Math.round(warmth * 100)
    );
    const col = Phaser.Display.Color.GetColor(pipeColor.r, pipeColor.g, pipeColor.b);

    // Outer pipe
    g.lineStyle(9, P.pipeOuter, 1);
    g.lineBetween(fx, fy, fx + 30, fy);
    g.lineBetween(fx + 30, fy, fx + 30, ty);
    g.lineBetween(fx + 30, ty, tx, ty);
    // Coloured hot inner
    g.lineStyle(5, col, 1);
    g.lineBetween(fx, fy, fx + 30, fy);
    g.lineBetween(fx + 30, fy, fx + 30, ty);
    g.lineBetween(fx + 30, ty, tx, ty);

    // Return pipe
    g.lineStyle(7, P.pipeOuter, 0.7);
    g.lineBetween(tx, ty + 18, fx + 40, ty + 18);
    g.lineBetween(fx + 40, ty + 18, fx + 40, fy + 16);
    g.lineBetween(fx + 40, fy + 16, fx, fy + 16);
    g.lineStyle(3, 0x4488ff, 0.5);
    g.lineBetween(tx, ty + 18, fx + 40, ty + 18);
    g.lineBetween(fx + 40, ty + 18, fx + 40, fy + 16);
    g.lineBetween(fx + 40, fy + 16, fx, fy + 16);

    // Fittings
    [
      [fx + 30, fy], [fx + 30, ty], [fx + 30, ty],
      [tx, ty], [tx, ty + 18]
    ].forEach(([cx, cy]) => {
      g.fillStyle(P.pipeFit, 1);
      g.fillCircle(cx, cy, 6);
    });
  }

  /* ─────────── WATER TANK ─────────── */
  _buildWaterTank(W, H) {
    const tx = W * 0.52, ty = this._groundY - 70;
    const tw = 110, th = 140;

    this._tankX = tx; this._tankY = ty;
    this._tankW = tw; this._tankH = th;

    // Insulation wrapper
    const g = this.add.graphics();
    g.fillStyle(P.tankInsul, 1);
    g.fillRoundedRect(tx - tw/2 - 6, ty - th/2 - 6, tw + 12, th + 12, 10);
    // Insulation bands
    g.lineStyle(4, P.tankInsulDark, 0.5);
    g.lineBetween(tx - tw/2 - 6, ty - 20, tx + tw/2 + 6, ty - 20);
    g.lineBetween(tx - tw/2 - 6, ty + 20, tx + tw/2 + 6, ty + 20);

    // Tank body
    g.fillStyle(P.tankBodyDark, 1);
    g.fillRoundedRect(tx - tw/2, ty - th/2, tw, th, 8);
    g.fillStyle(P.tankBody, 1);
    g.fillRoundedRect(tx - tw/2 + 2, ty - th/2 + 2, tw - 4, th - 4, 6);
    g.lineStyle(2, P.tankMetal, 0.6);
    g.strokeRoundedRect(tx - tw/2, ty - th/2, tw, th, 8);
    // Metal bands
    g.lineStyle(4, P.tankMetal, 0.4);
    g.lineBetween(tx - tw/2, ty - 18, tx + tw/2, ty - 18);
    g.lineBetween(tx - tw/2, ty + 18, tx + tw/2, ty + 18);
    // Sheen
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(tx - tw/2 + 6, ty - th/2 + 6, 16, th - 12, 4);

    // Water fill (redrawn in update)
    this.waterFillGfx = this.add.graphics();
    // Tank label
    this.add.text(tx, ty + th/2 + 16, "HOT WATER TANK", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#5a8aaa", align: "center", letterSpacing: 1
    }).setOrigin(0.5);

    // Bubble container
    this._bubbleGfx = this.add.graphics();
  }

  _redrawWater(warmth) {
    const g = this.waterFillGfx;
    g.clear();
    const { _tankX: tx, _tankY: ty, _tankW: tw, _tankH: th } = this;

    const fillH = (0.2 + warmth * 0.55) * (th - 8);
    const fillY = ty + th/2 - 4 - fillH;

    const wColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x44, g: 0x88, b: 0xdd },
      { r: 0xff, g: 0x44, b: 0x22 },
      100, Math.round(warmth * 100)
    );
    const col = Phaser.Display.Color.GetColor(wColor.r, wColor.g, wColor.b);

    // Clipping-like effect via fillRect inside tank bounds
    g.fillStyle(col, 0.65 + warmth * 0.25);
    g.fillRoundedRect(tx - tw/2 + 4, fillY, tw - 8, fillH, { tl: 0, tr: 0, bl: 5, br: 5 });
    // Surface shimmer
    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(tx - tw/2 + 6, fillY + 2, tw - 16, 6, 3);
  }

  /* ─────────── THERMOMETER ─────────── */
  _buildThermometer(W, H) {
    const tx = W * 0.7, ty = H * 0.16;
    const tw = 24, th = 180;

    this._thermoX = tx; this._thermoY = ty;
    this._thermoH = th;

    // Outer glass tube
    const g = this.add.graphics();
    g.fillStyle(P.thermoGlass, 1);
    g.fillRoundedRect(tx - tw/2, ty, tw, th, tw/2);
    g.lineStyle(2, P.thermoBorder, 0.8);
    g.strokeRoundedRect(tx - tw/2, ty, tw, th, tw/2);
    // Sheen
    g.fillStyle(0xffffff, 0.3);
    g.fillRoundedRect(tx - tw/2 + 3, ty + 4, 5, th - 16, 3);

    // Tick marks & scale labels
    const minT = 20, maxT = 80;
    for (let t = minT; t <= maxT; t += 10) {
      const norm = (t - minT) / (maxT - minT);
      const ly = ty + th - 16 - norm * (th - 28);
      const isMajor = t % 20 === 0;

      g.lineStyle(isMajor ? 2 : 1, P.thermoTick, isMajor ? 0.9 : 0.5);
      g.lineBetween(tx + tw/2, ly, tx + tw/2 + (isMajor ? 10 : 6), ly);

      if (isMajor) {
        this.add.text(tx + tw/2 + 14, ly, `${t}°`, {
          fontFamily: "'Courier New', monospace", fontSize: "10px",
          color: "#5588aa"
        }).setOrigin(0, 0.5);
      }
    }

    // Bulb
    this.add.circle(tx, ty + th + 8, 14, P.thermoBulb, 1);
    this.add.circle(tx - 4, ty + th + 4, 5, 0xff8888, 0.5);

    // Fill bar (redrawn in update)
    this.thermoFillGfx = this.add.graphics();

    // Current temp label
    this.thermoLabel = this.add.text(tx, ty - 18, "—", {
      fontFamily: "'Georgia', serif", fontSize: "18px",
      color: "#ff4455", fontStyle: "bold", align: "center"
    }).setOrigin(0.5);

    this.add.text(tx, ty - 36, "TEMPERATURE", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#5a8aaa", letterSpacing: 2, align: "center"
    }).setOrigin(0.5);
  }

  _redrawThermometer(temp) {
    const g = this.thermoFillGfx;
    g.clear();
    const { _thermoX: tx, _thermoY: ty, _thermoH: th } = this;
    const tw = 24;
    const minT = 20, maxT = 80;
    const norm = Phaser.Math.Clamp((temp - minT) / (maxT - minT), 0, 1);
    const fillH = Math.max(4, norm * (th - 28));
    const fillY = ty + th - 16 - fillH;

    const warmth = Phaser.Math.Clamp((temp - this.startTemp) / 50, 0, 1);
    const tColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x44, g: 0x88, b: 0xff },
      { r: 0xff, g: 0x33, b: 0x22 },
      100, Math.round(warmth * 100)
    );
    const col = Phaser.Display.Color.GetColor(tColor.r, tColor.g, tColor.b);

    g.fillStyle(col, 1);
    g.fillRoundedRect(tx - 6, fillY, 12, fillH + 18, 5);
    // Bulb fill
    g.fillStyle(col, 1);
    g.fillCircle(tx, ty + th + 8, 11);
  }

  /* ─────────── READOUT PANEL ─────────── */
  _buildReadoutPanel(W, H) {
    const px = W * 0.78, py = H * 0.12;
    const pw = W - px - 14, ph = H * 0.52;

    this._readoutX = px; this._readoutY = py;
    this._readoutW = pw; this._readoutH = ph;

    const pg = this.add.graphics();
    pg.fillStyle(0x000000, 0.3);
    pg.fillRoundedRect(px + 3, py + 5, pw, ph, 10);
    pg.fillStyle(P.panelBg, 1);
    pg.fillRoundedRect(px, py, pw, ph, 10);
    pg.lineStyle(2, P.panelBorder, 1);
    pg.strokeRoundedRect(px, py, pw, ph, 10);
    pg.fillStyle(P.panelAccent, 1);
    pg.fillRoundedRect(px, py, pw, 5, { tl: 10, tr: 10, bl: 0, br: 0 });

    const cx = px + pw/2;
    this.add.text(cx, py + 18, "SOLAR METER", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#ffcc00", letterSpacing: 3
    }).setOrigin(0.5);

    const lcdRow = (label, yy, color) => {
      const lh = 32, lx = px + 8, lw = pw - 16;
      const lg = this.add.graphics();
      lg.fillStyle(P.lcdBg, 1);
      lg.fillRoundedRect(lx, yy, lw, lh, 5);
      lg.lineStyle(1, P.panelBorder, 1);
      lg.strokeRoundedRect(lx, yy, lw, lh, 5);
      this.add.text(lx + 5, yy + 4, label, {
        fontFamily: "'Courier New', monospace", fontSize: "8px",
        color: "#1a3a18", letterSpacing: 1
      });
      return this.add.text(lx + lw - 5, yy + lh/2, "—", {
        fontFamily: "'Courier New', monospace", fontSize: "13px",
        color: color ?? "#88ff44", align: "right"
      }).setOrigin(1, 0.5);
    };

    let ry = py + 34;
    this._lcdSun   = lcdRow("SUNLIGHT %", ry, "#ffcc00");  ry += 38;
    this._lcdTemp  = lcdRow("TEMP (°C)", ry, "#ff8844");    ry += 38;
    this._lcdRise  = lcdRow("RISE (°C)", ry, "#ff4422");    ry += 38;
    this._lcdTime  = lcdRow("TIME (min)", ry, "#88ff44");   ry += 42;

    // Rate indicator bar
    this.add.text(cx, ry, "HEAT RATE", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#2a5a28", letterSpacing: 2
    }).setOrigin(0.5);
    ry += 14;

    const barW = pw - 24, barH = 10;
    const bgBar = this.add.graphics();
    bgBar.fillStyle(P.sliderTrack, 1);
    bgBar.fillRoundedRect(px + 12, ry, barW, barH, 4);

    this.rateBar = this.add.graphics();
    this._rateBarX = px + 12;
    this._rateBarY = ry;
    this._rateBarW = barW;
  }

  _updateReadouts() {
    const warmth = Phaser.Math.Clamp((this.temp - this.startTemp) / 45, 0, 1);
    const rise = (this.temp - this.startTemp).toFixed(1);

    this._lcdSun.setText(`${this.sun} %`).setColor(
      this.sun > 70 ? "#ffcc00" : this.sun > 40 ? "#88ff44" : "#4488ff"
    );
    this._lcdTemp.setText(`${this.temp.toFixed(1)} °C`).setColor(
      this.temp > 55 ? "#ff3322" : this.temp > 42 ? "#ff8844" : "#88ff44"
    );
    this._lcdRise.setText(`+${rise} °C`);
    this._lcdTime.setText(`${this.timeMin.toFixed(1)} min`);

    // Rate bar
    const g = this.rateBar;
    g.clear();
    const rateColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x44, g: 0x88, b: 0xff },
      { r: 0xff, g: 0x44, b: 0x22 },
      100, Math.round(warmth * 100)
    );
    const col = Phaser.Display.Color.GetColor(rateColor.r, rateColor.g, rateColor.b);
    g.fillStyle(col, 1);
    g.fillRoundedRect(this._rateBarX, this._rateBarY, this._rateBarW * warmth, 10, 4);
  }

  /* ─────────── TEMPERATURE GRAPH ─────────── */
  _buildGraph(W, H) {
    const gx = W * 0.78, gy = H * 0.66;
    const gw = W - gx - 14, gh = H - gy - 20;

    this._graphX = gx; this._graphY = gy;
    this._graphW = gw; this._graphH = gh;

    const bg = this.add.graphics();
    bg.fillStyle(P.graphBg, 1);
    bg.fillRoundedRect(gx, gy, gw, gh, 8);
    bg.lineStyle(1.5, P.panelBorder, 0.7);
    bg.strokeRoundedRect(gx, gy, gw, gh, 8);

    // Grid lines
    bg.lineStyle(1, P.graphGrid, 1);
    for (let i = 1; i < 4; i++) {
      bg.lineBetween(gx + 8, gy + (gh/4)*i, gx + gw - 8, gy + (gh/4)*i);
    }

    this.add.text(gx + gw/2, gy + 8, "TEMP TREND", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: "#8aaac0", letterSpacing: 2, align: "center"
    }).setOrigin(0.5);

    this.graphLineGfx = this.add.graphics();
  }

  _redrawGraph() {
    const g = this.graphLineGfx;
    g.clear();
    const pts = this._graphPoints;
    if (pts.length < 2) return;

    const { _graphX: gx, _graphY: gy, _graphW: gw, _graphH: gh } = this;
    const pad = 12;
    const minT = 20, maxT = 80;

    const toX = (i) => gx + pad + (i / (this._maxGraphPoints - 1)) * (gw - pad * 2);
    const toY = (t) => gy + gh - pad - ((t - minT) / (maxT - minT)) * (gh - pad * 2);

    g.lineStyle(2, P.graphLine, 0.9);
    for (let i = 1; i < pts.length; i++) {
      g.lineBetween(toX(i - 1), toY(pts[i-1]), toX(i), toY(pts[i]));
    }
    // Latest dot
    const last = pts[pts.length - 1];
    g.fillStyle(P.graphDot, 1);
    g.fillCircle(toX(pts.length - 1), toY(last), 3);
  }

  /* ─────────── SUNLIGHT SLIDER ─────────── */
  _buildSlider(W, H) {
    const sx = 30, sy = H - 38;
    const sw = W * 0.62;

    this._sliderX  = sx; this._sliderY = sy;
    this._sliderW  = sw;

    const bg = this.add.graphics();
    bg.fillStyle(P.panelBg, 0.85);
    bg.fillRoundedRect(sx - 12, sy - 20, sw + 44, 46, 8);
    bg.lineStyle(1.5, P.panelBorder, 1);
    bg.strokeRoundedRect(sx - 12, sy - 20, sw + 44, 46, 8);

    // ☀ icon
    this.add.text(sx - 6, sy + 3, "☀", { fontSize: "18px" }).setOrigin(0, 0.5);

    // Track
    const tg = this.add.graphics();
    tg.fillStyle(P.sliderTrack, 1);
    tg.fillRoundedRect(sx + 22, sy - 5, sw - 22, 10, 5);

    this.sliderFillGfx = this.add.graphics();
    this.sliderThumbGfx = this.add.graphics();

    this._redrawSlider();

    // Slider hit zone
    const hit = this.add.rectangle(sx + 22 + (sw - 22)/2, sy, sw - 22, 28, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });

    hit.on("pointerdown", (p) => {
      this._isDraggingSlider = true;
      this._updateSliderFromPointer(p);
    });
    this.input.on("pointermove", (p) => {
      if (this._isDraggingSlider) this._updateSliderFromPointer(p);
    });
    this.input.on("pointerup", () => { this._isDraggingSlider = false; });

    this.sliderLabel = this.add.text(sx + sw + 30, sy, "", {
      fontFamily: "'Courier New', monospace", fontSize: "12px",
      color: "#ffcc00"
    }).setOrigin(0.5);
  }

  _updateSliderFromPointer(p) {
    const { _sliderX: sx, _sliderW: sw } = this;
    const rx = Phaser.Math.Clamp(p.x - sx - 22, 0, sw - 22);
    this.sun = Math.round((rx / (sw - 22)) * 100);
    this._redrawSlider();
  }

  _redrawSlider() {
    const g = this.sliderFillGfx;
    g.clear();
    const { _sliderX: sx, _sliderY: sy, _sliderW: sw } = this;
    const trackW = sw - 22, tx = sx + 22;

    const pct = this.sun / 100;
    const sunColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x44, g: 0x88, b: 0xff },
      { r: 0xff, g: 0xcc, b: 0x00 },
      100, this.sun
    );
    const col = Phaser.Display.Color.GetColor(sunColor.r, sunColor.g, sunColor.b);

    g.fillStyle(col, 1);
    g.fillRoundedRect(tx, sy - 5, trackW * pct, 10, 5);

    // Thumb
    const tg = this.sliderThumbGfx;
    tg.clear();
    const thumbX = tx + trackW * pct;
    tg.fillStyle(P.sliderThumb, 1);
    tg.fillCircle(thumbX, sy, 11);
    tg.lineStyle(2.5, col, 1);
    tg.strokeCircle(thumbX, sy, 11);
    tg.fillStyle(col, 1);
    tg.fillCircle(thumbX, sy, 5);

    if (this.sliderLabel) this.sliderLabel.setText(`${this.sun}%`).setColor(
      this.sun > 70 ? "#ffcc00" : this.sun > 40 ? "#ffffff" : "#88bbff"
    );
  }

  /* ─────────── HEADER ─────────── */
  _buildHeader(W, H) {
    const hg = this.add.graphics().setDepth(5);
    hg.fillStyle(P.panelBg, 0.9);
    hg.fillRoundedRect(14, 6, W * 0.62, 54, 8);
    hg.lineStyle(1.5, P.panelBorder, 1);
    hg.strokeRoundedRect(14, 6, W * 0.62, 54, 8);
    hg.fillStyle(P.panelAccent, 1);
    hg.fillRect(14, 6, 4, 54);

    this.add.text(26, 12, "LAB 09", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#ffcc00", letterSpacing: 3
    }).setDepth(6);
    this.add.text(26, 28, "Solar Heating", {
      fontFamily: "'Georgia', serif", fontSize: "19px",
      color: "#ffffff", fontStyle: "bold"
    }).setDepth(6);
    this._hintTxt = this.add.text(26, 50, "Use slider or ← → keys to change sunlight intensity.", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#5a8aaa"
    }).setDepth(6);
  }

  /* ─────────── KEYS ─────────── */
  _hookKeys(W, H) {
    this.input.keyboard.on("keydown-LEFT",  () => { this.sun = Phaser.Math.Clamp(this.sun - 5, 0, 100); this._redrawSlider(); });
    this.input.keyboard.on("keydown-RIGHT", () => { this.sun = Phaser.Math.Clamp(this.sun + 5, 0, 100); this._redrawSlider(); });
  }

  /* ─────────── UPDATE ─────────── */
  update(time, delta) {
    const dt = delta / 1000;
    this.timeMin += dt * 0.25;

    // Temperature physics
    const target = this.startTemp + (this.sun / 100) * 45;
    this.temp = Phaser.Math.Linear(this.temp, target, this.heatRate * dt * 3);

    const warmth = Phaser.Math.Clamp((this.temp - this.startTemp) / 45, 0, 1);

    // Record graph point every ~2s
    if (Math.floor(this.timeMin * 30) > this._graphPoints.length) {
      this._graphPoints.push(this.temp);
      if (this._graphPoints.length > this._maxGraphPoints) this._graphPoints.shift();
      this._redrawGraph();
    }

    // ── Sun ──
    const sunY = this._sunBaseY - this._sunriseAnim * 12 + Math.sin(time * 0.0004) * 4;
    this._sunY = sunY;
    [this.sunHalo2, this.sunHalo1, this.sunOuter, this.sunCore, this.sunSheen].forEach(c => c.y = sunY);
    this.sunHalo1.setAlpha(0.2 + (this.sun / 100) * 0.5);
    this.sunHalo2.setAlpha(0.08 + (this.sun / 100) * 0.25);
    const sunBright = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0xff, g: 0xee, b: 0x66 },
      { r: 0xff, g: 0xcc, b: 0x00 },
      100, this.sun
    );
    this.sunCore.setFillStyle(Phaser.Display.Color.GetColor(sunBright.r, sunBright.g, sunBright.b));
    this._drawRays(time);

    // Sky glow
    this.skyGlow.setAlpha((this.sun / 100) * 0.18);

    // ── Panel ──
    this._updatePanelSheen(time);
    this.panelGlowGfx.clear();
    if (this.sun > 10) {
      const px = this._panelCX, py = this._panelCY;
      this.panelGlowGfx.fillStyle(P.sunGlow, (this.sun / 100) * 0.1);
      this.panelGlowGfx.fillRoundedRect(px - 105 + 8, py - 65 + 8, 194, 114, 4);
    }

    // ── Clouds (drift slowly) ──
    this._clouds.forEach(({ g, baseX, speed }) => {
      g.x = baseX + Math.sin(time * 0.0003 * speed) * 18;
    });

    // ── Pipes ──
    this._redrawPipes(warmth);

    // ── Water tank ──
    this._redrawWater(warmth);

    // Bubble spawning
    if (warmth > 0.6 && Math.random() < 0.04 * warmth) {
      const bx = this._tankX + Phaser.Math.Between(-30, 30);
      const by = this._tankY + this._tankH/2 - 20;
      this._waterBubbles.push({ x: bx, y: by, r: Phaser.Math.FloatBetween(1.5, 3.5), alpha: 0.6 });
    }
    this._bubbleGfx.clear();
    this._waterBubbles = this._waterBubbles.filter(b => {
      b.y -= 1.2;
      b.alpha -= 0.012;
      if (b.alpha <= 0) return false;
      this._bubbleGfx.lineStyle(1, 0xffffff, b.alpha);
      this._bubbleGfx.strokeCircle(b.x, b.y, b.r);
      return true;
    });

    // ── Thermometer ──
    this._displayTemp = Phaser.Math.Linear(this._displayTemp, this.temp, 0.05);
    this._redrawThermometer(this._displayTemp);
    this.thermoLabel.setText(`${this._displayTemp.toFixed(1)} °C`).setColor(
      warmth > 0.7 ? "#ff3322" : warmth > 0.4 ? "#ff8844" : "#4488ff"
    );

    // ── Readouts ──
    this._updateReadouts();

    // Hint
    if (this.sun === 0) {
      this._hintTxt.setText("No sunlight — water cools. Increase sunlight →");
    } else if (this.sun >= 90) {
      this._hintTxt.setText(`🔥 Maximum solar intensity! Temp: ${this.temp.toFixed(1)}°C`);
    } else {
      this._hintTxt.setText(`Sunlight: ${this.sun}%  ·  Target temp: ${target.toFixed(0)}°C  ·  Rising: ${warmth > 0.05 ? "Yes" : "No"}`);
    }

    this.emitMeasurement({
      sun:     `${this.sun}%`,
      tempC:   this.temp.toFixed(1),
      timeMin: this.timeMin.toFixed(1),
      tempRise:(this.temp - this.startTemp).toFixed(1),
    });
  }
}