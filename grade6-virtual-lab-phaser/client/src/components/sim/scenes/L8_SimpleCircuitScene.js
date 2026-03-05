import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════════
   PALETTE  –  industrial blueprint / circuit board
═══════════════════════════════════════════════════ */
const P = {
  // Background
  bg:            0x0a1628,
  bgMid:         0x0d1e35,
  grid:          0x0f2844,
  gridLine:      0x163352,

  // Board / panel
  boardBg:       0x0c1e30,
  boardEdge:     0x1a3a5c,
  boardTrace:    0x1a4a2a,
  copper:        0xc87028,
  copperDark:    0x8a4810,

  // Wires
  wireOff:       0x2a4060,
  wireOn:        0x00e5ff,
  wireGlow:      0x0088aa,
  wireHot:       0x00ffcc,
  wirePreview:   0x4488ff,

  // Nodes
  nodeFill:      0x1a3a5c,
  nodeBorder:    0x2a6090,
  nodeHover:     0x00c8ff,
  nodeSelected:  0x00e5ff,
  nodeConnected: 0x00c890,

  // Components
  batteryBody:   0x1e3a52,
  batteryPlus:   0xff4444,
  batteryMinus:  0x4488ff,
  batteryMetal:  0x8aaccc,

  switchBody:    0x1a3040,
  switchOn:      0x00e090,
  switchOff:     0xff4444,
  switchLever:   0xd0c090,

  bulbBody:      0x1e3040,
  bulbGlass:     0x334466,
  bulbFilament:  0xaa8844,
  bulbOffGlow:   0x222233,
  bulbWarm:      0xffcc44,
  bulbHot:       0xffffff,

  // Readout panel
  panelBg:       0x060f1a,
  panelBorder:   0x1a3a5c,
  panelAccent:   0x00e5ff,
  lcdBg:         0x060a06,
  lcdOn:         0x00ff88,
  lcdDim:        0x003320,

  // Text
  textBright:    0xe0f4ff,
  textMid:       0x6a9cbe,
  textDim:       0x2a4a68,
  textGreen:     0x00e090,
  textRed:       0xff5566,
  textAmber:     0xffb030,

  // Current particles
  particleA:     0x00e5ff,
  particleB:     0x00ffcc,
  spark:         0xffffff,
};

/* Wire node layout – positions on the circuit board */
const NODE_DEFS = {
  Bp:  { x: 155, y: 175, label: "+",  comp: "battery",  side: "top"    },
  Bm:  { x: 155, y: 320, label: "–",  comp: "battery",  side: "bottom" },
  Sw1: { x: 330, y: 175, label: "IN", comp: "switch",   side: "top"    },
  Sw2: { x: 330, y: 320, label: "OUT",comp: "switch",   side: "bottom" },
  L1:  { x: 510, y: 175, label: "A",  comp: "bulb",     side: "top"    },
  L2:  { x: 510, y: 320, label: "B",  comp: "bulb",     side: "bottom" },
};

const REQUIRED_EDGES = [
  ["Bp", "Sw1"],
  ["Sw1", "L1"],
  ["L1", "L2"],
  ["L2", "Sw2"],
  ["Sw2", "Bm"],
];

/* ═══════════════════════════════════════════════════
   SCENE
═══════════════════════════════════════════════════ */
export default class L8_SimpleCircuitScene extends BaseLabScene {
  constructor(opts) {
    super("L8_SimpleCircuitScene", opts);
    this.voltage      = opts.labConfig?.voltage         ?? 3.0;
    this.resistance   = opts.labConfig?.resistanceOhms  ?? 10;
    this.connections  = new Set();
    this.selectedNode = null;
    this.switchClosed = false;

    // Current flow particles
    this._particles   = [];
    this._brightness  = 0;
    this._targetBrightness = 0;
    this._bulbPulse   = 0;

    // Ammeter needle
    this._needleAngle = -0.9;      // radians, –0.9 = zero

    // Wire preview
    this._previewLine = null;
  }

  /* ──────────────────────── CREATE ──────────────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._W = W; this._H = H;

    this._buildBackground(W, H);
    this._buildBoard(W, H);
    this._buildComponents(W, H);
    this._buildNodes(W, H);
    this._buildWireLayer(W, H);
    this._buildReadoutPanel(W, H);
    this._buildHeader(W, H);
    this._hookKeys(W, H);

    // Intro animations
    this._animateIntro();
  }

  /* ─────────── BG ─────────── */
  _buildBackground(W, H) {
    this.add.rectangle(W/2, H/2, W, H, P.bg);

    // Blueprint grid
    const g = this.add.graphics();
    g.lineStyle(1, P.gridLine, 0.5);
    for (let x = 0; x <= W; x += 30) g.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 30) g.lineBetween(0, y, W, y);

    // Brighter major grid
    g.lineStyle(1, P.grid, 0.9);
    for (let x = 0; x <= W; x += 120) g.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 120) g.lineBetween(0, y, W, y);

    // Vignette
    const v = this.add.graphics();
    v.fillStyle(0x000000, 0.45);
    v.fillRect(0, 0, W, 32);
    v.fillRect(0, H - 32, W, 32);
    v.fillRect(0, 0, 32, H);
    v.fillRect(W - 32, 0, 32, H);
  }

  /* ─────────── CIRCUIT BOARD ─────────── */
  _buildBoard(W, H) {
    const bx = 30, by = 70, bw = W * 0.62, bh = H - 100;

    const bg = this.add.graphics();
    // Board outer shadow
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(bx + 4, by + 6, bw, bh, 10);
    // Board fill
    bg.fillStyle(P.boardBg, 1);
    bg.fillRoundedRect(bx, by, bw, bh, 10);
    // Board edge
    bg.lineStyle(2, P.boardEdge, 1);
    bg.strokeRoundedRect(bx, by, bw, bh, 10);
    // Copper traces (decorative)
    bg.lineStyle(3, P.boardTrace, 0.25);
    bg.lineBetween(bx + 20, by + 20, bx + bw - 20, by + 20);
    bg.lineBetween(bx + 20, by + bh - 20, bx + bw - 20, by + bh - 20);
    bg.lineStyle(2, P.copper, 0.15);
    for (let i = 0; i < 5; i++) {
      bg.lineBetween(bx + 40 + i * 30, by + 10, bx + 40 + i * 30, by + bh - 10);
    }

    // Corner mounting holes
    [[bx + 14, by + 14], [bx + bw - 14, by + 14],
     [bx + 14, by + bh - 14], [bx + bw - 14, by + bh - 14]].forEach(([hx, hy]) => {
      bg.fillStyle(P.bg, 1);
      bg.fillCircle(hx, hy, 5);
      bg.lineStyle(1, P.copper, 0.4);
      bg.strokeCircle(hx, hy, 5);
    });

    this._boardX = bx; this._boardY = by;
    this._boardW = bw; this._boardH = bh;
  }

  /* ─────────── COMPONENTS ─────────── */
  _buildComponents(W, H) {
    // ── Battery ──
    this._drawBattery(100, 195);

    // ── Switch ──
    this._buildSwitch(275, 195);

    // ── Bulb ──
    this._buildBulb(455, 195);
  }

  _drawBattery(x, y) {
    const g = this.add.graphics();
    const w = 110, h = 105;

    // Body
    g.fillStyle(P.batteryBody, 1);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(2, P.boardEdge, 1);
    g.strokeRoundedRect(x, y, w, h, 8);

    // + terminal top
    g.fillStyle(P.batteryPlus, 1);
    g.fillRoundedRect(x + 8, y + 8, w - 16, 38, 5);
    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(x + 8, y + 8, w - 16, 12, { tl: 5, tr: 5, bl: 0, br: 0 });
    g.lineStyle(1.5, 0xff8888, 0.5);
    g.strokeRoundedRect(x + 8, y + 8, w - 16, 38, 5);

    // – terminal bottom
    g.fillStyle(P.batteryMinus, 1);
    g.fillRoundedRect(x + 8, y + h - 46, w - 16, 38, 5);
    g.fillStyle(0xffffff, 0.1);
    g.fillRoundedRect(x + 8, y + h - 46, w - 16, 12, { tl: 5, tr: 5, bl: 0, br: 0 });
    g.lineStyle(1.5, 0x8888ff, 0.5);
    g.strokeRoundedRect(x + 8, y + h - 46, w - 16, 38, 5);

    // Labels
    this.add.text(x + w/2, y + 27, `${this.voltage}V`, {
      fontFamily: "'Courier New', monospace", fontSize: "14px",
      color: "#ffcccc", fontStyle: "bold"
    }).setOrigin(0.5);
    this.add.text(x + w/2, y + h - 27, "GND", {
      fontFamily: "'Courier New', monospace", fontSize: "11px",
      color: "#aabbff"
    }).setOrigin(0.5);

    // Component label
    this.add.text(x + w/2, y + h/2, "BATTERY", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#2a4a68", letterSpacing: 2
    }).setOrigin(0.5);
  }

  _buildSwitch(x, y) {
    const w = 110, h = 105;

    this._switchGfx = this.add.graphics();
    this._switchX = x; this._switchY = y;
    this._switchW = w; this._switchH = h;
    this._redrawSwitch();

    // Click to toggle
    const hit = this.add.rectangle(x + w/2, y + h/2, w, h, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on("pointerdown", () => {
      this.switchClosed = !this.switchClosed;
      this._redrawSwitch();
      this._onCircuitChange();
    });
    hit.on("pointerover", () => {
      this._switchGfx.lineStyle(2.5, P.nodeHover, 0.8);
      this._switchGfx.strokeRoundedRect(x, y, w, h, 8);
    });
    hit.on("pointerout", () => this._redrawSwitch());
  }

  _redrawSwitch() {
    const g = this._switchGfx;
    g.clear();
    const { _switchX: x, _switchY: y, _switchW: w, _switchH: h } = this;
    const on = this.switchClosed;

    g.fillStyle(P.switchBody, 1);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(2, on ? P.switchOn : P.switchOff, 0.8);
    g.strokeRoundedRect(x, y, w, h, 8);

    // Lever pivot + arm
    const pivotX = x + w * 0.3, pivotY = y + h * 0.55;
    const armLen = 40;
    const armAngle = on ? -0.5 : 0.5;
    const armEndX = pivotX + Math.cos(armAngle) * armLen;
    const armEndY = pivotY + Math.sin(armAngle) * armLen;

    g.lineStyle(5, P.switchLever, 1);
    g.lineBetween(pivotX, pivotY, armEndX, armEndY);
    g.fillStyle(P.switchLever, 1);
    g.fillCircle(pivotX, pivotY, 6);
    g.fillStyle(on ? P.switchOn : P.switchOff, 1);
    g.fillCircle(armEndX, armEndY, 5);

    // Contact points
    g.fillStyle(P.copper, 1);
    g.fillCircle(pivotX, pivotY + 3, 4);
    g.fillCircle(x + w * 0.72, pivotY + 3, 4);

    // Status badge
    g.fillStyle(on ? P.switchOn : P.switchOff, 0.15);
    g.fillRoundedRect(x + 8, y + h - 28, w - 16, 20, 4);
    g.lineStyle(1, on ? P.switchOn : P.switchOff, 0.6);
    g.strokeRoundedRect(x + 8, y + h - 28, w - 16, 20, 4);

    // Text labels
    this.add.text(x + w/2, y + 16, "SWITCH", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#2a4a68", letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);
    this.add.text(x + w/2, y + h - 18, on ? "CLOSED" : "OPEN", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: on ? "#00e090" : "#ff5566"
    }).setOrigin(0.5).setDepth(2);
    this.add.text(x + w/2, y + h + 10, "[ S ] or click", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#2a4a68"
    }).setOrigin(0.5);
  }

  _buildBulb(x, y) {
    const w = 110, h = 105;

    this.bulbGfx = this.add.graphics();
    this._bulbX = x; this._bulbY = y;
    this._bulbW = w; this._bulbH = h;

    // Outer glow (behind bulb)
    this.bulbGlowCircle = this.add.circle(x + w/2, y + h * 0.38, 52, P.bulbWarm, 0)
      .setDepth(1);
    this.bulbGlowOuter = this.add.circle(x + w/2, y + h * 0.38, 76, P.bulbWarm, 0)
      .setDepth(0);

    this._redrawBulb(0);
    this.add.text(x + w/2, y + h + 10, "Brightness: —", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#2a4a68"
    }).setOrigin(0.5).setName("bulbPct");
  }

  _redrawBulb(brightness) {
    const g = this.bulbGfx;
    g.clear();
    const { _bulbX: x, _bulbY: y, _bulbW: w, _bulbH: h } = this;

    // Body
    g.fillStyle(P.bulbBody, 1);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(2, brightness > 0.1 ? P.wireOn : P.boardEdge, brightness > 0.1 ? 0.8 : 0.5);
    g.strokeRoundedRect(x, y, w, h, 8);

    // Bulb glass dome
    const cx = x + w/2, cy = y + h * 0.38, r = 36;
    const glassColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 0x33, g: 0x44, b: 0x66 },
      { r: 0xff, g: 0xdd, b: 0x88 },
      100, Math.round(brightness * 100)
    );
    g.fillStyle(Phaser.Display.Color.GetColor(glassColor.r, glassColor.g, glassColor.b), 1);
    g.fillCircle(cx, cy, r);

    // Glass shine
    g.fillStyle(0xffffff, 0.18 + brightness * 0.22);
    g.fillEllipse(cx - r * 0.28, cy - r * 0.3, r * 0.45, r * 0.32);
    g.fillStyle(0xffffff, 0.08 + brightness * 0.12);
    g.fillCircle(cx - r * 0.38, cy - r * 0.42, r * 0.1);

    // Filament
    const filColor = brightness > 0.05
      ? Phaser.Display.Color.GetColor(
          Math.min(255, 0x88 + Math.round(brightness * 0x77)),
          Math.min(255, 0x44 + Math.round(brightness * 0x88)),
          Math.round(brightness * 0x22))
      : P.bulbFilament;
    g.lineStyle(2, filColor, 0.9);
    // Zigzag filament
    const fw = 18, fTop = cy - 10, fBot = cy + 10;
    for (let i = 0; i < 3; i++) {
      g.lineBetween(cx - fw/2 + i * (fw/3), i % 2 === 0 ? fTop : fBot,
                    cx - fw/2 + (i+1) * (fw/3), i % 2 === 0 ? fBot : fTop);
    }

    // Screw base
    g.fillStyle(P.batteryMetal, 0.4);
    g.fillRect(x + w * 0.28, y + h * 0.72, w * 0.44, h * 0.22);
    for (let i = 0; i < 4; i++) {
      g.lineStyle(1, 0x000000, 0.2);
      g.lineBetween(x + w * 0.28, y + h * 0.72 + i * 6, x + w * 0.72, y + h * 0.72 + i * 6);
    }

    // Component label
    this.add.text(x + w/2, y + 14, "BULB", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#2a4a68", letterSpacing: 2
    }).setOrigin(0.5).setDepth(3);
  }

  /* ─────────── NODES ─────────── */
  _buildNodes(W, H) {
    this.nodes = {};
    this._nodeDots = {};

    Object.entries(NODE_DEFS).forEach(([id, def]) => {
      this.nodes[id] = { x: def.x, y: def.y };

      // Ring + dot
      const g = this.add.graphics().setDepth(10);
      this._drawNode(g, 0, 0, "idle");
      g.x = def.x; g.y = def.y;
      this._nodeDots[id] = g;

      // ID label
      this.add.text(def.x, def.y - 24, id, {
        fontFamily: "'Courier New', monospace", fontSize: "10px",
        color: "#2a6090"
      }).setOrigin(0.5).setDepth(11);

      // Hit zone
      const hit = this.add.circle(def.x, def.y, 18, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true })
        .setDepth(12);

      hit.on("pointerover", () => {
        if (this.selectedNode && this.selectedNode !== id) {
          this._drawNode(this._nodeDots[id], 0, 0, "hover-target");
        } else {
          this._drawNode(this._nodeDots[id], 0, 0, "hover");
        }
      });
      hit.on("pointerout", () => this._refreshNodeState(id));
      hit.on("pointerdown", () => this._onNodeClick(id));
    });
  }

  _drawNode(g, x, y, state) {
    g.clear();
    const colors = {
      "idle":         { fill: P.nodeFill,    border: P.nodeBorder,   r: 8 },
      "hover":        { fill: P.nodeFill,    border: P.nodeHover,    r: 9 },
      "hover-target": { fill: P.nodeFill,    border: P.wirePreview,  r: 9 },
      "selected":     { fill: P.nodeSelected,border: P.nodeSelected, r: 10 },
      "connected":    { fill: P.boardBg,     border: P.nodeConnected,r: 8 },
    };
    const c = colors[state] ?? colors["idle"];

    // Outer glow ring
    if (state === "selected" || state === "hover-target") {
      g.fillStyle(c.border, 0.18);
      g.fillCircle(x, y, 18);
    }
    // Border ring
    g.lineStyle(2.5, c.border, 1);
    g.strokeCircle(x, y, c.r);
    // Inner fill
    g.fillStyle(c.fill, 1);
    g.fillCircle(x, y, c.r - 2);
    // Centre dot
    g.fillStyle(c.border, 1);
    g.fillCircle(x, y, 3);
  }

  _refreshNodeState(id) {
    const isSelected  = this.selectedNode === id;
    const isConnected = Array.from(this.connections).some(k => k.includes(id));
    const state = isSelected ? "selected" : isConnected ? "connected" : "idle";
    this._drawNode(this._nodeDots[id], 0, 0, state);
  }

  /* ─────────── WIRES ─────────── */
  _buildWireLayer(W, H) {
    this.wireGfx = this.add.graphics().setDepth(6);
    this.wireGlowGfx = this.add.graphics().setDepth(5);

    // Preview wire (mouse drag)
    this.previewGfx = this.add.graphics().setDepth(7);
    this.input.on("pointermove", (p) => {
      if (!this.selectedNode) return;
      const n = this.nodes[this.selectedNode];
      this.previewGfx.clear();
      this.previewGfx.lineStyle(2, P.wirePreview, 0.55);
      this.previewGfx.lineBetween(n.x, n.y, p.x, p.y);
    });
  }

  _edgeKey(a, b) { return [a, b].sort().join("~"); }

  _onNodeClick(id) {
    this.previewGfx.clear();
    if (!this.selectedNode) {
      this.selectedNode = id;
      this._drawNode(this._nodeDots[id], 0, 0, "selected");
      return;
    }
    if (this.selectedNode === id) {
      this.selectedNode = null;
      this._refreshNodeState(id);
      return;
    }

    const key = this._edgeKey(this.selectedNode, id);
    const wasConnected = this.connections.has(key);
    if (wasConnected) this.connections.delete(key);
    else this.connections.add(key);

    const prev = this.selectedNode;
    this.selectedNode = null;
    this._refreshNodeState(prev);
    this._refreshNodeState(id);
    this._redrawWires();
    this._onCircuitChange();
  }

  _redrawWires() {
    this.wireGfx.clear();
    for (const key of this.connections) {
      const [a, b] = key.split("~");
      const A = this.nodes[a], B = this.nodes[b];
      if (!A || !B) continue;

      // Offset wire with an elbow
      this._drawWireSegment(this.wireGfx, A.x, A.y, B.x, B.y, P.wireOff, 3.5, 0.9);
    }
  }

  _drawWireSegment(g, x1, y1, x2, y2, color, thick, alpha) {
    g.lineStyle(thick, color, alpha);
    // Simple elbow routing: H then V
    if (Math.abs(x1 - x2) > 10 && Math.abs(y1 - y2) > 10) {
      const mx = (x1 + x2) / 2;
      g.lineBetween(x1, y1, mx, y1);
      g.lineBetween(mx, y1, mx, y2);
      g.lineBetween(mx, y2, x2, y2);
    } else {
      g.lineBetween(x1, y1, x2, y2);
    }
  }

  _onCircuitChange() {
    this._redrawWires();
    const closed = this._isCircuitClosed();
    if (closed && this._brightness < 0.05) {
      this._spawnClosedEffect();
    }
  }

  /* ─────────── CIRCUIT LOGIC ─────────── */
  _isCircuitClosed() {
    const wired = REQUIRED_EDGES.every(([a, b]) => this.connections.has(this._edgeKey(a, b)));
    return wired && this.switchClosed;
  }

  /* ─────────── READOUT PANEL ─────────── */
  _buildReadoutPanel(W, H) {
    const pw = W - this._boardX - this._boardW - 14;
    const px = this._boardX + this._boardW + 8;
    const py = 70, ph = H - 100;

    const pg = this.add.graphics();
    // Shadow
    pg.fillStyle(0x000000, 0.4);
    pg.fillRoundedRect(px + 3, py + 5, pw, ph, 10);
    // Panel fill
    pg.fillStyle(P.panelBg, 1);
    pg.fillRoundedRect(px, py, pw, ph, 10);
    pg.lineStyle(2, P.panelBorder, 1);
    pg.strokeRoundedRect(px, py, pw, ph, 10);
    // Accent bar
    pg.fillStyle(P.panelAccent, 1);
    pg.fillRoundedRect(px, py, pw, 5, { tl: 10, tr: 10, bl: 0, br: 0 });

    const cx = px + pw / 2;
    let ry = py + 18;

    // Title
    this.add.text(cx, ry, "METER", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#00e5ff", letterSpacing: 4
    }).setOrigin(0.5);
    ry += 20;

    // ── Ammeter gauge ──
    this._ammeterCX = cx;
    this._ammeterCY = ry + 62;
    this._buildAmmeter(cx, ry + 62, Math.min(pw - 20, 100));
    ry += 136;

    // ── LCD rows ──
    const lx = px + 8, lw = pw - 16;

    const lcdRow = (label, yy) => {
      const lcdH = 32;
      const lcdG = this.add.graphics();
      lcdG.fillStyle(P.lcdBg, 1);
      lcdG.fillRoundedRect(lx, yy, lw, lcdH, 5);
      lcdG.lineStyle(1, P.panelBorder, 1);
      lcdG.strokeRoundedRect(lx, yy, lw, lcdH, 5);
      this.add.text(lx + 6, yy + 4, label, {
        fontFamily: "'Courier New', monospace", fontSize: "8px",
        color: "#1a4a48", letterSpacing: 1
      });
      const val = this.add.text(lx + lw - 6, yy + lcdH / 2, "—", {
        fontFamily: "'Courier New', monospace", fontSize: "13px",
        color: P.lcdOn === 0x00ff88 ? "#00ff88" : "#00ff88", align: "right"
      }).setOrigin(1, 0.5);
      return val;
    };

    this._lcdV = lcdRow("VOLTAGE (V)", ry);         ry += 38;
    this._lcdR = lcdRow("RESISTANCE (Ω)", ry);       ry += 38;
    this._lcdI = lcdRow("CURRENT (A)", ry);          ry += 38;
    this._lcdPct = lcdRow("BRIGHTNESS", ry);         ry += 46;

    // R adjustment buttons
    const btnY = ry - 4;
    [["-1Ω", -1, cx - 28], ["+1Ω", +1, cx + 28]].forEach(([lbl, delta, bx]) => {
      const btn = this.add.graphics();
      btn.fillStyle(0x0a1e30, 1);
      btn.fillRoundedRect(bx - 22, btnY - 13, 44, 26, 5);
      btn.lineStyle(1.5, P.panelBorder, 1);
      btn.strokeRoundedRect(bx - 22, btnY - 13, 44, 26, 5);

      const t = this.add.text(bx, btnY, lbl, {
        fontFamily: "'Courier New', monospace", fontSize: "11px",
        color: "#6a9cbe"
      }).setOrigin(0.5);

      const hit = this.add.rectangle(bx, btnY, 44, 26, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on("pointerdown", () => {
        this.resistance = Phaser.Math.Clamp(this.resistance + delta, 1, 50);
        this._updateReadouts(this._isCircuitClosed());
      });
      hit.on("pointerover",  () => t.setColor("#00e5ff"));
      hit.on("pointerout",   () => t.setColor("#6a9cbe"));
    });

    ry += 34;
    this.add.text(cx, ry, "↑/↓ keys or buttons", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: "#2a4a68", align: "center"
    }).setOrigin(0.5);

    // Circuit status
    ry += 22;
    this._statusDot = this.add.circle(cx - 36, ry, 7, P.switchOff, 1);
    this._statusTxt = this.add.text(cx - 24, ry, "OPEN", {
      fontFamily: "'Courier New', monospace", fontSize: "12px",
      color: "#ff5566"
    }).setOrigin(0, 0.5);
  }

  _buildAmmeter(cx, cy, diameter) {
    const r = diameter / 2;

    const g = this.add.graphics();
    // Dial face
    g.fillStyle(0x060f1a, 1);
    g.fillCircle(cx, cy, r);
    g.lineStyle(2, P.panelBorder, 1);
    g.strokeCircle(cx, cy, r);
    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = -Math.PI * 0.8 + (i / 10) * Math.PI * 1.6;
      const ir = r - 8, or_ = r - (i % 5 === 0 ? 3 : 5);
      g.lineStyle(i % 5 === 0 ? 1.5 : 1, P.textMid, 0.7);
      g.lineBetween(cx + Math.cos(angle) * ir, cy + Math.sin(angle) * ir,
                    cx + Math.cos(angle) * or_, cy + Math.sin(angle) * or_);
    }
    // 'A' label
    this.add.text(cx, cy + r * 0.35, "A", {
      fontFamily: "'Courier New', monospace", fontSize: "12px",
      color: "#2a6090"
    }).setOrigin(0.5);

    // Needle (redrawn in update)
    this._needleGfx = this.add.graphics().setDepth(15);
    this._ammeterR = r;
    this._needleAngle = -Math.PI * 0.8;  // starts at zero mark
  }

  _updateAmmeterNeedle(angle) {
    const g = this._needleGfx;
    g.clear();
    const cx = this._ammeterCX, cy = this._ammeterCY, r = this._ammeterR;
    const nx = cx + Math.cos(angle) * (r - 10);
    const ny = cy + Math.sin(angle) * (r - 10);
    // Needle
    g.lineStyle(2, P.wireOn, 1);
    g.lineBetween(cx, cy, nx, ny);
    // Pivot
    g.fillStyle(P.panelAccent, 1);
    g.fillCircle(cx, cy, 4);
  }

  /* ─────────── HEADER ─────────── */
  _buildHeader(W, H) {
    const hg = this.add.graphics().setDepth(20);
    hg.fillStyle(P.panelBg, 0.95);
    hg.fillRoundedRect(this._boardX, 6, this._boardW, 58, 8);
    hg.lineStyle(1.5, P.panelBorder, 1);
    hg.strokeRoundedRect(this._boardX, 6, this._boardW, 58, 8);
    hg.fillStyle(P.panelAccent, 1);
    hg.fillRect(this._boardX, 6, 4, 58);

    this.add.text(this._boardX + 14, 12, "LAB 08", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#00e5ff", letterSpacing: 3
    }).setDepth(21);
    this.add.text(this._boardX + 14, 28, "Simple Circuit Builder", {
      fontFamily: "'Georgia', serif", fontSize: "19px",
      color: "#e0f4ff", fontStyle: "bold"
    }).setDepth(21);
    this._hintTxt = this.add.text(this._boardX + 14, 52, "Click two nodes to connect them with a wire.", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#2a6090"
    }).setDepth(21);
  }

  /* ─────────── KEYS ─────────── */
  _hookKeys(W, H) {
    this.input.keyboard.on("keydown-UP", () => {
      this.resistance = Phaser.Math.Clamp(this.resistance + 1, 1, 50);
      this._updateReadouts(this._isCircuitClosed());
    });
    this.input.keyboard.on("keydown-DOWN", () => {
      this.resistance = Phaser.Math.Clamp(this.resistance - 1, 1, 50);
      this._updateReadouts(this._isCircuitClosed());
    });
    this.input.keyboard.on("keydown-S", () => {
      this.switchClosed = !this.switchClosed;
      this._redrawSwitch();
      this._onCircuitChange();
    });
  }

  /* ─────────── READOUT UPDATE ─────────── */
  _updateReadouts(closed) {
    const I = closed ? this.voltage / this.resistance : 0;
    const pct = Math.round(Phaser.Math.Clamp(I / 0.35, 0, 1) * 100);

    this._lcdV.setText(`${this.voltage.toFixed(1)} V`);
    this._lcdR.setText(`${this.resistance} Ω`);
    this._lcdI.setText(closed ? `${I.toFixed(3)} A` : "0.000 A");
    this._lcdPct.setText(closed ? `${pct} %` : "0 %");
    this._lcdI.setColor(I > 0.2 ? "#ffaa00" : "#00ff88");

    this._statusDot.setFillStyle(closed ? P.switchOn : P.switchOff);
    this._statusTxt.setText(closed ? "CLOSED" : "OPEN").setColor(closed ? "#00e090" : "#ff5566");

    // Hint
    const wired = REQUIRED_EDGES.every(([a, b]) => this.connections.has(this._edgeKey(a, b)));
    if (!wired) {
      this._hintTxt.setText(`Connect: ${this._missingEdges().join(", ")}`);
    } else if (!this.switchClosed) {
      this._hintTxt.setText("All wired! Close the switch [S] to complete the circuit.");
    } else {
      this._hintTxt.setText(`Circuit live! Current = ${I.toFixed(3)} A  ·  Brightness = ${pct}%`);
    }
  }

  _missingEdges() {
    return REQUIRED_EDGES
      .filter(([a, b]) => !this.connections.has(this._edgeKey(a, b)))
      .map(([a, b]) => `${a}→${b}`);
  }

  /* ─────────── CURRENT PARTICLES ─────────── */
  _spawnClosedEffect() {
    // Flash all connected wires bright momentarily
    this.tweens.add({
      targets: this.wireGfx,
      alpha: 0,
      duration: 60,
      yoyo: true,
      repeat: 2,
    });
  }

  _spawnParticle() {
    // Spawn a particle along a random required edge
    const edge = Phaser.Utils.Array.GetRandom(REQUIRED_EDGES);
    const [a, b] = edge;
    const A = this.nodes[a], B = this.nodes[b];
    if (!A || !B) return;

    const dot = this.add.circle(A.x, A.y, 3,
      Math.random() > 0.5 ? P.particleA : P.particleB, 1).setDepth(8);
    this.tweens.add({
      targets: dot,
      x: B.x, y: B.y,
      duration: Phaser.Math.Between(300, 600),
      ease: "Sine.InOut",
      onComplete: () => dot.destroy()
    });
  }

  /* ─────────── INTRO ANIMATION ─────────── */
  _animateIntro() {
    this._updateReadouts(false);
    this._updateAmmeterNeedle(this._needleAngle);
  }

  /* ─────────── UPDATE ─────────── */
  update(time) {
    const closed = this._isCircuitClosed();
    const I = closed ? this.voltage / this.resistance : 0;
    const targetBrightness = Phaser.Math.Clamp(I / 0.35, 0, 1);

    // Smooth brightness transition
    this._brightness = Phaser.Math.Linear(this._brightness, targetBrightness, 0.06);
    const b = this._brightness;

    // Redraw bulb
    this._redrawBulb(b);

    // Bulb glow circles
    this.bulbGlowCircle.setAlpha(b * 0.55);
    this.bulbGlowOuter.setAlpha(b * 0.18);
    const pulse = 1 + Math.sin(time / 300) * b * 0.08;
    this.bulbGlowCircle.setScale(pulse);
    this.bulbGlowOuter.setScale(0.95 + b * 0.15);

    // Ammeter needle animation
    const targetAngle = -Math.PI * 0.8 + targetBrightness * Math.PI * 1.6;
    this._needleAngle = Phaser.Math.Linear(this._needleAngle, targetAngle, 0.08);
    this._updateAmmeterNeedle(this._needleAngle);

    // Animated glowing wires when circuit closed
    if (closed && b > 0.05) {
      this.wireGlowGfx.clear();
      for (const key of this.connections) {
        const [a, bk] = key.split("~");
        const A = this.nodes[a], B = this.nodes[bk];
        if (!A || !B) continue;
        const alpha = 0.12 + Math.sin(time / 180) * 0.06;
        this._drawWireSegment(this.wireGlowGfx, A.x, A.y, B.x, B.y, P.wireOn, 9, alpha * b);
        this._drawWireSegment(this.wireGlowGfx, A.x, A.y, B.x, B.y, P.wireHot, 3.5, 0.85 * b);
      }
      // Spawn current particles
      if (Math.random() < 0.12 * b) this._spawnParticle();
    } else {
      this.wireGlowGfx.clear();
      // Redraw static off-wires
      this._redrawWires();
    }

    // Update readouts occasionally (not every frame for perf)
    if (Math.round(time / 200) !== this._lastReadoutTick) {
      this._lastReadoutTick = Math.round(time / 200);
      this._updateReadouts(closed);
    }

    this.emitMeasurement({
      circuit:    closed ? "closed" : "open",
      switch:     this.switchClosed ? "closed" : "open",
      V:          this.voltage.toFixed(1),
      R:          this.resistance,
      I:          I.toFixed(3),
      brightness: `${Math.round(b * 100)}%`,
    });
  }
}