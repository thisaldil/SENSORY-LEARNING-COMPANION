import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════════
   PALETTE  –  acoustic / oscilloscope lab
═══════════════════════════════════════════════════ */
const P = {
  bg:            0x080a10,
  bgMid:         0x0a0e18,
  gridLine:      0x0d1220,
  benchTop:      0x0e1520,
  benchEdge:     0x080d14,

  // Oscilloscope
  scopeBg:       0x030608,
  scopeGrid:     0x0a1a12,
  scopeGridBright:0x0f2a1a,
  scopeLine:     0x00ff88,
  scopeGlow:     0x00aa55,
  scopeBezel:    0x1a2a1a,
  scopeScreen:   0x020a06,
  scopeSheen:    0x224422,

  // Waveform colours per source
  drum:          0x44aaff,
  bell:          0xffcc44,
  string:        0x44ffaa,
  clap:          0xff6688,
  whistle:       0xcc88ff,

  // Vibration meter
  meterBg:       0x060c08,
  meterBorder:   0x1a3a22,
  meterLow:      0x2255ff,
  meterMid:      0xffaa22,
  meterHigh:     0xff3322,
  meterSegment:  0x0a1a10,

  // Ripple / particles
  rippleA:       0x44aaff,
  rippleB:       0xffcc44,
  rippleC:       0x44ffaa,
  rippleD:       0xff6688,
  rippleE:       0xcc88ff,

  // Instrument buttons
  drumBtn:       0x1a2a4a,
  drumBorder:    0x4488ff,
  drumAccent:    0x44aaff,
  bellBtn:       0x2a2a10,
  bellBorder:    0xcc9922,
  bellAccent:    0xffcc44,
  stringBtn:     0x0a2a1a,
  stringBorder:  0x228855,
  stringAccent:  0x44ffaa,
  clapBtn:       0x2a1020,
  clapBorder:    0xaa3355,
  clapAccent:    0xff6688,
  whistleBtn:    0x1a1030,
  whistleBorder: 0x8844bb,
  whistleAccent: 0xcc88ff,

  // Panel
  panelBg:       0x06080f,
  panelBorder:   0x1a2a3a,
  panelAccent:   0x00aaff,
  lcdBg:         0x030406,
  lcdOn:         0x00ffaa,
  lcdDim:        0x042a18,

  // Spectrum
  specBg:        0x030508,
  specBar:       0x00aaff,
  specBarHot:    0x00ffaa,
  specGrid:      0x080f18,

  textBright:    0xd0ffee,
  textMid:       0x5a8a70,
  textDim:       0x1a3a28,
};

/* Source definitions */
const SOURCES = [
  { id: "drum",    label: "Hit Drum",     emoji: "🥁", amp: 90, freq: 1.1, decay: 0.88, harmonics: [1, 0.6, 0.3],    color: P.drum,    btn: { bg: P.drumBtn,    border: P.drumBorder,   accent: P.drumAccent   } },
  { id: "bell",    label: "Ring Bell",    emoji: "🔔", amp: 72, freq: 2.2, decay: 0.96, harmonics: [1, 0.5, 0.8, 0.3],color: P.bell,    btn: { bg: P.bellBtn,    border: P.bellBorder,   accent: P.bellAccent   } },
  { id: "string",  label: "Pluck String", emoji: "🎸", amp: 62, freq: 1.8, decay: 0.93, harmonics: [1, 0.7, 0.4, 0.2],color: P.string,  btn: { bg: P.stringBtn,  border: P.stringBorder, accent: P.stringAccent } },
  { id: "clap",    label: "Clap Hands",   emoji: "👏", amp: 48, freq: 0.9, decay: 0.82, harmonics: [1, 0.4, 0.6, 0.2],color: P.clap,    btn: { bg: P.clapBtn,    border: P.clapBorder,   accent: P.clapAccent   } },
  { id: "whistle", label: "Blow Whistle", emoji: "🎵", amp: 55, freq: 3.5, decay: 0.91, harmonics: [1, 0.2, 0.1],     color: P.whistle, btn: { bg: P.whistleBtn, border: P.whistleBorder,accent: P.whistleAccent} },
];

export default class L6_SoundVibrationScene extends BaseLabScene {
  constructor(opts) {
    super("L6_SoundVibrationScene", opts);
    this.maxAmplitude = opts.labConfig?.maxAmplitude ?? 100;
    this.source       = null;
    this.amp          = 0;
    this._displayAmp  = 0;
    this._ripples     = [];
    this._particles   = [];
    this._waveHistory = [];   // stores recent waveform for trail effect
    this._needleAngle = -Math.PI * 0.75;
    this._lastSource  = null;
    this._hitFlash    = 0;
  }

  /* ──────────────────────── CREATE ──────────────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._W = W; this._H = H;

    this._buildBackground(W, H);
    this._buildBench(W, H);
    this._buildOscilloscope(W, H);
    this._buildVibrationMeter(W, H);
    this._buildInstrumentButtons(W, H);
    this._buildSpectrumAnalyser(W, H);
    this._buildReadoutPanel(W, H);
    this._buildRippleLayer(W, H);
    this._buildHeader(W, H);
  }

  /* ─────────── BACKGROUND ─────────── */
  _buildBackground(W, H) {
    this.add.rectangle(W/2, H/2, W, H, P.bg);

    const g = this.add.graphics();
    g.fillStyle(P.gridLine, 0.8);
    for (let x = 0; x <= W; x += 36)
      for (let y = 0; y <= H; y += 36)
        g.fillRect(x, y, 1, 1);

    const v = this.add.graphics();
    v.fillStyle(0x000000, 0.5);
    v.fillRect(0, 0, W, 20);
    v.fillRect(0, H - 20, W, 20);
    v.fillRect(0, 0, 20, H);
    v.fillRect(W - 20, 0, 20, H);
  }

  /* ─────────── BENCH ─────────── */
  _buildBench(W, H) {
    const by = H * 0.58;
    this._benchY = by;
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(P.benchTop, 1);
    g.fillRoundedRect(40, by - 8, W - 80, 18, 4);
    g.lineStyle(1.5, P.benchEdge, 1);
    g.strokeRoundedRect(40, by - 8, W - 80, 18, 4);
    g.fillStyle(0xffffff, 0.04);
    g.fillRoundedRect(40, by - 8, W - 80, 5, 4);
    g.fillStyle(P.benchEdge, 1);
    g.fillRoundedRect(55, by - 3, W - 110, 7, 2);
  }

  /* ─────────── OSCILLOSCOPE ─────────── */
  _buildOscilloscope(W, H) {
    const ox = W * 0.37, oy = H * 0.12;
    const ow = W * 0.59, oh = H * 0.44;
    this._scopeX = ox; this._scopeY = oy;
    this._scopeW = ow; this._scopeH = oh;

    // Bezel
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(ox + 4, oy + 5, ow, oh, 12);
    g.fillStyle(P.scopeBezel, 1);
    g.fillRoundedRect(ox, oy, ow, oh, 12);
    g.lineStyle(2, 0x2a4a2a, 1);
    g.strokeRoundedRect(ox, oy, ow, oh, 12);

    // Controls on bezel (decorative)
    [[ox + ow - 18, oy + 14], [ox + ow - 18, oy + 32]].forEach(([kx, ky]) => {
      g.fillStyle(0x1a2a1a, 1);
      g.fillCircle(kx, ky, 7);
      g.lineStyle(1, 0x3a5a3a, 1);
      g.strokeCircle(kx, ky, 7);
      g.lineStyle(1.5, 0x5a8a5a, 1);
      g.lineBetween(kx, ky - 4, kx, ky + 4);
    });

    // Screen inset
    const pad = 14;
    g.fillStyle(P.scopeScreen, 1);
    g.fillRoundedRect(ox + pad, oy + pad, ow - pad * 2 - 22, oh - pad * 2, 6);
    g.lineStyle(1, P.scopeSheen, 0.3);
    g.strokeRoundedRect(ox + pad, oy + pad, ow - pad * 2 - 22, oh - pad * 2, 6);

    this._scrX = ox + pad + 4;
    this._scrY = oy + pad + 4;
    this._scrW = ow - pad * 2 - 22 - 8;
    this._scrH = oh - pad * 2 - 8;
    this._scrMidY = this._scrY + this._scrH / 2;

    // Grid
    const gg = this.add.graphics().setDepth(6);
    gg.lineStyle(1, P.scopeGrid, 0.8);
    const cols = 8, rows = 5;
    for (let i = 1; i < cols; i++) {
      gg.lineBetween(this._scrX + i * (this._scrW / cols), this._scrY,
                     this._scrX + i * (this._scrW / cols), this._scrY + this._scrH);
    }
    for (let i = 1; i < rows; i++) {
      gg.lineBetween(this._scrX, this._scrY + i * (this._scrH / rows),
                     this._scrX + this._scrW, this._scrY + i * (this._scrH / rows));
    }
    // Centre lines brighter
    gg.lineStyle(1, P.scopeGridBright, 1);
    const mx = this._scrX + this._scrW / 2;
    const my = this._scrMidY;
    gg.lineBetween(mx, this._scrY, mx, this._scrY + this._scrH);
    gg.lineBetween(this._scrX, my, this._scrX + this._scrW, my);

    // Screen sheen
    const sg = this.add.graphics().setDepth(9);
    sg.fillStyle(0xffffff, 0.04);
    sg.fillRoundedRect(this._scrX, this._scrY, this._scrW * 0.55, this._scrH * 0.3, 4);

    // Scan line label
    this.add.text(ox + pad + 4, oy + oh - 10, "OSCILLOSCOPE  —  TIME / DIV", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: `#${P.scopeGlow.toString(16).padStart(6,"0")}`, letterSpacing: 1
    }).setDepth(9);

    // Waveform graphics
    this.waveGfx     = this.add.graphics().setDepth(7);
    this.waveGlowGfx = this.add.graphics().setDepth(6);

    // Trigger level line
    this.triggerLine = this.add.graphics().setDepth(8);
    this.triggerLine.lineStyle(1, 0x00ff88, 0.25);
    this.triggerLine.lineBetween(this._scrX, this._scrMidY, this._scrX + this._scrW, this._scrMidY);

    // Hit flash overlay
    this.scopeFlash = this.add.rectangle(
      ox + pad + (ow - pad * 2 - 22) / 2,
      oy + pad + oh / 2 - pad,
      ow - pad * 2 - 22, oh - pad * 2,
      0xffffff, 0
    ).setAlpha(0).setDepth(8);
  }

  _drawWaveform(time) {
    const g = this.waveGfx, gg = this.waveGlowGfx;
    g.clear(); gg.clear();
    if (!this.source || this.amp < 0.5) {
      // Draw flat line
      g.lineStyle(1.5, P.scopeLine, 0.3);
      g.lineBetween(this._scrX, this._scrMidY, this._scrX + this._scrW, this._scrMidY);
      return;
    }

    const src   = SOURCES.find(s => s.id === this.source) ?? SOURCES[0];
    const col   = src.color;
    const ampPx = (this._displayAmp / this.maxAmplitude) * (this._scrH * 0.44);
    const freq  = src.freq;
    const harmonics = src.harmonics;

    const samples = 120;
    const points  = [];

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = this._scrX + t * this._scrW;
      let y = 0;
      harmonics.forEach((h, hi) => {
        y += Math.sin(time * 0.003 * freq * (hi + 1) + t * Math.PI * 2 * freq * (hi + 1) * 4) * ampPx * h;
      });
      // Envelope decay across screen width
      y *= Math.exp(-t * (1 - src.decay) * 4);
      points.push({ x, y: this._scrMidY + y });
    }

    // Glow pass
    gg.lineStyle(8, col, this._displayAmp / this.maxAmplitude * 0.12);
    for (let i = 1; i < points.length; i++) {
      gg.lineBetween(points[i-1].x, points[i-1].y, points[i].x, points[i].y);
    }

    // Main line
    g.lineStyle(2, col, 0.95);
    for (let i = 1; i < points.length; i++) {
      g.lineBetween(points[i-1].x, points[i-1].y, points[i].x, points[i].y);
    }

    // Bright inner line
    g.lineStyle(1, 0xffffff, this._displayAmp / this.maxAmplitude * 0.35);
    for (let i = 1; i < points.length; i++) {
      g.lineBetween(points[i-1].x, points[i-1].y, points[i].x, points[i].y);
    }
  }

  /* ─────────── VIBRATION METER ─────────── */
  _buildVibrationMeter(W, H) {
    const mx = 116, my = H * 0.75;
    const mw = 196, mh = 100;
    this._meterCX = mx; this._meterMY = my;
    this._meterW  = mw; this._meterH  = mh;

    const pg = this.add.graphics().setDepth(10);
    pg.fillStyle(0x000000, 0.3);
    pg.fillRoundedRect(mx - mw/2 + 3, my - mh/2 + 4, mw, mh, 10);
    pg.fillStyle(P.meterBg, 1);
    pg.fillRoundedRect(mx - mw/2, my - mh/2, mw, mh, 10);
    pg.lineStyle(1.5, P.meterBorder, 1);
    pg.strokeRoundedRect(mx - mw/2, my - mh/2, mw, mh, 10);
    pg.fillStyle(P.lcdOn, 1);
    pg.fillRoundedRect(mx - mw/2, my - mh/2, mw, 4, { tl: 10, tr: 10, bl: 0, br: 0 });

    this.add.text(mx, my - mh/2 + 14, "VIBRATION LEVEL", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.lcdOn.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(11);

    // Segmented bar track
    const segs = 16;
    const segTotalW = mw - 24;
    const segW = segTotalW / segs - 2;
    const segY = my - 4;

    const segBg = this.add.graphics().setDepth(11);
    for (let i = 0; i < segs; i++) {
      const sx = mx - mw/2 + 12 + i * (segTotalW / segs);
      segBg.fillStyle(P.meterSegment, 1);
      segBg.fillRoundedRect(sx, segY - 9, segW, 18, 3);
    }

    this.segGfx = this.add.graphics().setDepth(12);
    this._segCount = segs;
    this._segTotalW = segTotalW;
    this._segW = segW;
    this._segY = segY;

    // dB label
    this.dbLabel = this.add.text(mx, my + mh/2 - 14, "0 dB", {
      fontFamily: "'Georgia', serif", fontSize: "14px",
      color: `#${P.lcdDim.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setOrigin(0.5).setDepth(12);
  }

  _updateSegmentBar(tr) {
    const g = this.segGfx;
    g.clear();
    const lit = Math.round(tr * this._segCount);
    const mx = this._meterCX, mw = this._meterW;

    for (let i = 0; i < lit; i++) {
      const sx = mx - mw/2 + 12 + i * (this._segTotalW / this._segCount);
      const col = i < this._segCount * 0.5 ? P.meterLow
                : i < this._segCount * 0.8 ? P.meterMid
                : P.meterHigh;
      g.fillStyle(col, 1);
      g.fillRoundedRect(sx, this._segY - 9, this._segW, 18, 3);
      g.fillStyle(0xffffff, 0.15);
      g.fillRoundedRect(sx + 2, this._segY - 7, this._segW - 4, 6, 2);
    }

    const db = tr > 0 ? Math.round(20 * Math.log10(tr + 0.001) + 40) : 0;
    const dbCol = tr > 0.8 ? P.meterHigh : tr > 0.4 ? P.meterMid : P.lcdOn;
    this.dbLabel.setText(`${Math.max(0, db)} dB`)
      .setColor(`#${dbCol.toString(16).padStart(6,"0")}`);
  }

  /* ─────────── INSTRUMENT BUTTONS ─────────── */
  _buildInstrumentButtons(W, H) {
    const startX = 22, startY = H * 0.12;
    const bw = 196, bh = 62, gap = 10;
    this._btnCards = [];

    SOURCES.forEach((src, i) => {
      const cx = startX + bw / 2;
      const cy = startY + i * (bh + gap) + bh / 2;

      const cardGfx = this.add.graphics().setDepth(10);
      this._drawInstrCard(cardGfx, cx, cy, bw, bh, src, false);

      // Emoji icon
      const emojiTxt = this.add.text(cx - bw/2 + 22, cy, src.emoji, { fontSize: "22px" })
        .setOrigin(0.5).setDepth(12);

      // Label
      const nameTxt = this.add.text(cx - bw/2 + 44, cy - 10, src.label, {
        fontFamily: "'Courier New', monospace", fontSize: "12px",
        color: `#${P.textBright.toString(16).padStart(6,"0")}`
      }).setDepth(12);

      // Freq tag
      const freqTxt = this.add.text(cx - bw/2 + 44, cy + 8, `${src.freq.toFixed(1)} Hz  ·  ${Math.round(src.amp)}%`, {
        fontFamily: "'Courier New', monospace", fontSize: "9px",
        color: `#${src.btn.accent.toString(16).padStart(6,"0")}`
      }).setDepth(12);

      // Accent bar
      const accentBar = this.add.graphics().setDepth(11);
      accentBar.fillStyle(src.btn.accent, 0.8);
      accentBar.fillRoundedRect(startX, cy - bh/2, 3, bh, 2);

      // Hit zone
      const hit = this.add.rectangle(cx, cy, bw, bh, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true }).setDepth(13);

      hit.on("pointerover",  () => { if (this.source !== src.id) this._drawInstrCard(cardGfx, cx, cy, bw, bh, src, true); });
      hit.on("pointerout",   () => { if (this.source !== src.id) this._drawInstrCard(cardGfx, cx, cy, bw, bh, src, false); });
      hit.on("pointerdown",  () => this._pulse(src));

      // Pop-in animation
      cardGfx.setAlpha(0);
      [emojiTxt, nameTxt, freqTxt].forEach(t => t.setAlpha(0));
      this.tweens.add({ targets: [cardGfx, emojiTxt, nameTxt, freqTxt], alpha: 1,
        duration: 300, delay: 60 + i * 80, ease: "Sine.Out" });

      this._btnCards.push({ cardGfx, emojiTxt, nameTxt, freqTxt, accentBar, cx, cy, bw, bh, src });
    });
  }

  _drawInstrCard(g, cx, cy, cw, ch, src, hover) {
    g.clear();
    const isSel = this.source === src.id;
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(cx - cw/2 + 2, cy - ch/2 + 3, cw, ch, 8);
    g.fillStyle(isSel ? src.btn.bg : (hover ? src.btn.bg : P.panelBg), 1);
    g.fillRoundedRect(cx - cw/2, cy - ch/2, cw, ch, 8);
    g.fillStyle(0xffffff, isSel ? 0.08 : 0.03);
    g.fillRoundedRect(cx - cw/2 + 4, cy - ch/2 + 4, cw - 8, ch * 0.3, 5);
    const borderCol = isSel ? src.btn.accent : hover ? src.btn.border : P.panelBorder;
    g.lineStyle(isSel ? 2.5 : 1.5, borderCol, 1);
    g.strokeRoundedRect(cx - cw/2, cy - ch/2, cw, ch, 8);
    if (isSel) {
      g.lineStyle(5, src.btn.accent, 0.15);
      g.strokeRoundedRect(cx - cw/2 - 3, cy - ch/2 - 3, cw + 6, ch + 6, 11);
    }
  }

  /* ─────────── SPECTRUM ANALYSER ─────────── */
  _buildSpectrumAnalyser(W, H) {
    const sx = W * 0.37, sy = H * 0.62;
    const sw = W * 0.37, sh = H * 0.34;
    this._specX = sx; this._specY = sy;
    this._specW = sw; this._specH = sh;

    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(sx + 3, sy + 4, sw, sh, 10);
    bg.fillStyle(P.specBg, 1);
    bg.fillRoundedRect(sx, sy, sw, sh, 10);
    bg.lineStyle(1.5, P.panelBorder, 1);
    bg.strokeRoundedRect(sx, sy, sw, sh, 10);
    bg.fillStyle(P.lcdOn, 1);
    bg.fillRoundedRect(sx, sy, sw, 4, { tl: 10, tr: 10, bl: 0, br: 0 });
    bg.lineStyle(1, P.specGrid, 1);
    for (let i = 1; i < 5; i++) bg.lineBetween(sx + 8, sy + (sh/5)*i, sx + sw - 8, sy + (sh/5)*i);

    this.add.text(sx + sw/2, sy + 14, "FREQUENCY SPECTRUM", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: `#${P.lcdOn.toString(16).padStart(6,"0")}`, letterSpacing: 2
    }).setOrigin(0.5).setDepth(11);

    this.specGfx = this.add.graphics().setDepth(11);
    this._specBars = Array(12).fill(0);
  }

  _updateSpectrum(tr) {
    const g = this.specGfx;
    g.clear();
    if (!this.source) return;

    const src = SOURCES.find(s => s.id === this.source);
    if (!src) return;

    const { _specX: sx, _specY: sy, _specW: sw, _specH: sh } = this;
    const n = 12, pad = 14, barPad = 3;
    const barW = (sw - pad * 2 - barPad * (n - 1)) / n;
    const maxH  = sh - pad * 2 - 18;

    // Update bar heights with physics
    for (let i = 0; i < n; i++) {
      // Harmonic content based on source
      const harmonic = src.harmonics[i % src.harmonics.length] ?? 0.1;
      const freqFactor = Math.exp(-i * 0.18) * harmonic;
      const targetH = maxH * tr * freqFactor * (0.8 + 0.2 * Math.sin(i * 1.3 + Date.now() * 0.002));
      this._specBars[i] = Phaser.Math.Linear(this._specBars[i], targetH, 0.15);
    }

    for (let i = 0; i < n; i++) {
      const bx = sx + pad + i * (barW + barPad);
      const bh = Math.max(2, this._specBars[i]);
      const by = sy + sh - pad - bh;
      const pct = this._specBars[i] / maxH;
      const col = pct > 0.7 ? P.specBarHot : P.specBar;

      g.fillStyle(col, 0.85);
      g.fillRoundedRect(bx, by, barW, bh, 3);
      g.fillStyle(0xffffff, 0.15);
      g.fillRoundedRect(bx + 1, by + 2, barW - 2, Math.min(5, bh - 4), 2);
    }
  }

  /* ─────────── READOUT PANEL ─────────── */
  _buildReadoutPanel(W, H) {
    const px = W * 0.75, py = H * 0.62;
    const pw = W - px - 14, ph = H * 0.34;

    this._rdX = px; this._rdY = py;
    this._rdW = pw; this._rdH = ph;

    const pg = this.add.graphics().setDepth(10);
    pg.fillStyle(0x000000, 0.3);
    pg.fillRoundedRect(px + 3, py + 4, pw, ph, 10);
    pg.fillStyle(P.panelBg, 1);
    pg.fillRoundedRect(px, py, pw, ph, 10);
    pg.lineStyle(1.5, P.panelBorder, 1);
    pg.strokeRoundedRect(px, py, pw, ph, 10);
    pg.fillStyle(P.panelAccent, 1);
    pg.fillRoundedRect(px, py, pw, 4, { tl: 10, tr: 10, bl: 0, br: 0 });

    const cx = px + pw/2;
    this.add.text(cx, py + 14, "READOUT", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 3
    }).setOrigin(0.5).setDepth(11);

    const lcdRow = (label, yy) => {
      const lh = 28, lx = px + 8, lw = pw - 16;
      const lg = this.add.graphics().setDepth(11);
      lg.fillStyle(P.lcdBg, 1);
      lg.fillRoundedRect(lx, yy, lw, lh, 5);
      lg.lineStyle(1, P.panelBorder, 0.7);
      lg.strokeRoundedRect(lx, yy, lw, lh, 5);
      this.add.text(lx + 5, yy + 4, label, {
        fontFamily: "'Courier New', monospace", fontSize: "7px",
        color: `#${P.lcdDim.toString(16).padStart(6,"0")}`, letterSpacing: 1
      }).setDepth(12);
      return this.add.text(lx + lw - 5, yy + lh/2, "—", {
        fontFamily: "'Courier New', monospace", fontSize: "12px",
        color: `#${P.lcdOn.toString(16).padStart(6,"0")}`
      }).setOrigin(1, 0.5).setDepth(13);
    };

    let ry = py + 26;
    this._lcdSource = lcdRow("SOURCE",    ry); ry += 32;
    this._lcdAmp    = lcdRow("AMPLITUDE", ry); ry += 32;
    this._lcdLoud   = lcdRow("LOUDNESS",  ry); ry += 32;
    this._lcdFreq   = lcdRow("FREQUENCY", ry);
  }

  /* ─────────── RIPPLE LAYER ─────────── */
  _buildRippleLayer(W, H) {
    this.rippleGfx = this.add.graphics().setDepth(1);
    this._rippleCX = W * 0.18;
    this._rippleCY = this._benchY - 60;
  }

  _spawnRipple(src) {
    for (let i = 0; i < 3; i++) {
      this._ripples.push({
        x: this._rippleCX + Phaser.Math.Between(-20, 20),
        y: this._rippleCY + Phaser.Math.Between(-10, 10),
        r: 6 + i * 8,
        maxR: 80 + i * 20,
        alpha: 0.7,
        color: src.color,
        speed: 60 + i * 10,
      });
    }
    // Particle burst
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.FloatBetween(40, 100);
      this._particles.push({
        x: this._rippleCX, y: this._rippleCY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 0.8, r: Phaser.Math.FloatBetween(2, 4),
        color: src.color,
      });
    }
    // Scope flash
    this.tweens.add({ targets: this.scopeFlash, alpha: 0.12, duration: 60, yoyo: true });
  }

  _tickRipples(dt) {
    const g = this.rippleGfx;
    g.clear();

    this._ripples = this._ripples.filter(r => {
      r.r += r.speed * dt;
      r.alpha -= 0.7 * dt;
      if (r.alpha <= 0 || r.r > r.maxR) return false;
      g.lineStyle(2, r.color, r.alpha);
      g.strokeCircle(r.x, r.y, r.r);
      return true;
    });

    this._particles = this._particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.alpha -= 1.2 * dt;
      if (p.alpha <= 0) return false;
      g.fillStyle(p.color, p.alpha);
      g.fillCircle(p.x, p.y, p.r);
      return true;
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

    this.add.text(26, 12, "LAB 06", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.panelAccent.toString(16).padStart(6,"0")}`, letterSpacing: 3
    }).setDepth(21);
    this.add.text(26, 28, "Sound is Vibration", {
      fontFamily: "'Georgia', serif", fontSize: "19px",
      color: `#${P.textBright.toString(16).padStart(6,"0")}`, fontStyle: "bold"
    }).setDepth(21);
    this._hintTxt = this.add.text(W - 20, 22, "Click an instrument to make sound. Watch oscilloscope + spectrum.", {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: `#${P.textDim.toString(16).padStart(6,"0")}`, align: "right"
    }).setOrigin(1, 0).setDepth(21);
    this._srcLabel = this.add.text(W - 20, 40, "No source selected", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: `#${P.lcdDim.toString(16).padStart(6,"0")}`, align: "right"
    }).setOrigin(1, 0).setDepth(21);
  }

  /* ─────────── PULSE ─────────── */
  _pulse(src) {
    this.source = src.id;
    this.amp = Phaser.Math.Clamp(this.amp + src.amp * (this.maxAmplitude / 100), 0, this.maxAmplitude);
    this._spawnRipple(src);

    // Refresh all button cards
    this._btnCards.forEach(c => this._drawInstrCard(c.cardGfx, c.cx, c.cy, c.bw, c.bh, c.src, false));
  }

  /* ─────────── UPDATE ─────────── */
  update(time, delta) {
    const dt = delta / 1000;

    // Decay
    const src = SOURCES.find(s => s.id === this.source);
    const decayRate = src?.decay ?? 0.92;
    this.amp = this.amp > 0.2 ? this.amp * Math.pow(decayRate, delta / 16.67) : 0;

    this._displayAmp = Phaser.Math.Linear(this._displayAmp, this.amp, 0.12);
    const tr = this._displayAmp / this.maxAmplitude;

    // Oscilloscope
    this._drawWaveform(time);

    // Ripples
    this._tickRipples(dt);

    // Segment bar
    this._updateSegmentBar(tr);

    // Spectrum
    this._updateSpectrum(tr);

    // LCDs
    const loud = Math.round(tr * 100);
    this._lcdSource.setText(src ? `${src.emoji} ${src.label}` : "—")
      .setColor(src ? `#${src.color.toString(16).padStart(6,"0")}` : `#${P.lcdDim.toString(16).padStart(6,"0")}`);
    this._lcdAmp.setText(this.amp > 0 ? `${this.amp.toFixed(1)} u` : "0.0 u");
    this._lcdLoud.setText(`${loud} %`).setColor(
      loud > 80 ? `#${P.meterHigh.toString(16).padStart(6,"0")}`
    : loud > 40 ? `#${P.meterMid.toString(16).padStart(6,"0")}`
    :             `#${P.lcdOn.toString(16).padStart(6,"0")}`);
    this._lcdFreq.setText(src ? `${src.freq.toFixed(2)} Hz` : "—");

    // Header
    if (src && this.amp > 0.5) {
      this._srcLabel.setText(`${src.emoji}  ${src.label}  —  Decay: ${(src.decay * 100).toFixed(0)}%/frame`)
        .setColor(`#${src.color.toString(16).padStart(6,"0")}`);
    } else if (!src) {
      this._srcLabel.setText("Select an instrument above to begin").setColor(`#${P.textDim.toString(16).padStart(6,"0")}`);
    }

    this.emitMeasurement({
      source:    this.source ?? "None",
      amplitude: this.amp.toFixed(1),
      loudness:  `${loud}%`,
    });
  }
}