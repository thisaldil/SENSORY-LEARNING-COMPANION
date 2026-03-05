import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

/* ═══════════════════════════════════════════════════
   PALETTE  –  lush ecosystem / nature journal
═══════════════════════════════════════════════════ */
const P = {
  // Background
  bg:            0x1a2e1a,
  bgMid:         0x1e3820,
  gridLine:      0x223824,
  leaf:          0x2a4a2a,

  // Board
  boardBg:       0x0f1e0f,
  boardBorder:   0x2a4a2a,
  boardAccent:   0x5acd6a,

  // Node tiers
  producerBg:    0x1a3a0a,
  producerBorder:0x6abf2a,
  producerText:  0xc8f090,
  producerGlow:  0x4a9a1a,

  herbBg:        0x0a2a30,
  herbBorder:    0x2ab0c8,
  herbText:      0x90d8f0,
  herbGlow:      0x1a8aaa,

  carnivoreBg:   0x30100a,
  carnivoreBorder:0xd06030,
  carnivoreText: 0xf0c090,
  carnivoreGlow: 0xaa3010,

  omnivoreBg:    0x28200a,
  omnivoreBorder:0xc8a030,
  omnivoreText:  0xf0e090,
  omnivoreGlow:  0xaa8010,

  // Default node
  nodeBg:        0x1a2a1a,
  nodeBorder:    0x4a7a4a,
  nodeText:      0xd0f0d0,
  nodeGlow:      0x2a6a2a,

  // Arrows
  arrowCorrect:  0x6abf2a,
  arrowWrong:    0xd04040,
  arrowUnverif:  0x5a9a7a,
  arrowGlow:     0x2a5a3a,
  arrowPulse:    0x88ffaa,

  // Particles (energy flow)
  particleA:     0xaaff44,
  particleB:     0x44ffaa,
  particleC:     0xffee44,

  // Selection
  selectedRing:  0xffee44,
  selectedGlow:  0xffcc00,

  // Panel
  panelBg:       0x080f08,
  panelBorder:   0x2a4a2a,
  panelAccent:   0x5acd6a,
  lcdBg:         0x040a04,
  lcdOn:         0x88ff44,
  lcdDim:        0x0a2008,

  // Accuracy meter
  meterBg:       0x0a1a0a,
  meterLow:      0xd04040,
  meterMid:      0xd0aa20,
  meterHigh:     0x50cc30,

  // Text
  textBright:    0xe0f8e0,
  textMid:       0x6a9a6a,
  textDim:       0x2a4a2a,
  textGold:      0xffcc44,
};

/* Node tier classifier */
function getTier(name) {
  const n = name.toLowerCase();
  if (/grass|plant|tree|algae|shrub|fern|flower|seed|leaf|crop/.test(n)) return "producer";
  if (/rabbit|deer|caterpillar|aphid|mouse|cow|sheep|goat|insect|beetle|worm/.test(n)) return "herbivore";
  if (/fox|wolf|eagle|hawk|owl|shark|lion|tiger|snake|crocodile|spider/.test(n)) return "carnivore";
  if (/human|bear|pig|rat|crow|raccoon|boar/.test(n)) return "omnivore";
  return "default";
}

function tierColors(tier) {
  switch (tier) {
    case "producer":  return { bg: P.producerBg,   border: P.producerBorder,   text: P.producerText,   glow: P.producerGlow  };
    case "herbivore": return { bg: P.herbBg,        border: P.herbBorder,       text: P.herbText,       glow: P.herbGlow      };
    case "carnivore": return { bg: P.carnivoreBg,   border: P.carnivoreBorder,  text: P.carnivoreText,  glow: P.carnivoreGlow };
    case "omnivore":  return { bg: P.omnivoreBg,    border: P.omnivoreBorder,   text: P.omnivoreText,   glow: P.omnivoreGlow  };
    default:          return { bg: P.nodeBg,        border: P.nodeBorder,       text: P.nodeText,       glow: P.nodeGlow      };
  }
}

function tierEmoji(tier) {
  switch (tier) {
    case "producer":  return "🌿";
    case "herbivore": return "🐰";
    case "carnivore": return "🦅";
    case "omnivore":  return "🐻";
    default:          return "●";
  }
}

/* ═══════════════════════════════════════════════════
   SCENE
═══════════════════════════════════════════════════ */
export default class L10_FoodWebScene extends BaseLabScene {
  constructor(opts) {
    super("L10_FoodWebScene", opts);
    this.nodes        = opts.labConfig?.nodes ?? [];
    this.correctLinks = new Set((opts.labConfig?.links ?? []).map(([a, b]) => `${a}→${b}`));
    this.links        = new Set();
    this.selected     = null;

    // Energy flow particles along each arrow
    this._flowParticles = [];
    this._lastAccuracy  = -1;
    this._completionShown = false;
  }

  /* ──────────────────────── CREATE ──────────────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._W = W; this._H = H;

    this._buildBackground(W, H);
    this._buildBoard(W, H);
    this._buildArrowLayer(W, H);
    this._buildNodes(W, H);
    this._buildPanel(W, H);
    this._buildHeader(W, H);
    this._buildLegend(W, H);
    this._buildCompletionOverlay(W, H);

    this._redraw();
  }

  /* ─────────── BG ─────────── */
  _buildBackground(W, H) {
    this.add.rectangle(W/2, H/2, W, H, P.bg);

    // Organic hex-grid feel
    const g = this.add.graphics();
    g.lineStyle(1, P.gridLine, 0.4);
    for (let x = 0; x <= W; x += 44) g.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 44) g.lineBetween(0, y, W, y);

    // Scattered leaf silhouettes
    const lg = this.add.graphics();
    lg.fillStyle(P.leaf, 0.25);
    const leafPositions = [[50,40],[720,80],[100,380],[680,350],[380,410],[200,100],[550,390]];
    leafPositions.forEach(([lx, ly]) => {
      lg.fillEllipse(lx, ly, 28, 16);
      lg.fillEllipse(lx + 18, ly - 8, 18, 10);
    });

    // Vignette
    const v = this.add.graphics();
    v.fillStyle(0x000000, 0.5);
    v.fillRect(0, 0, W, 28);
    v.fillRect(0, H - 28, W, 28);
    v.fillRect(0, 0, 28, H);
    v.fillRect(W - 28, 0, 28, H);
  }

  /* ─────────── BOARD ─────────── */
  _buildBoard(W, H) {
    const bx = 28, by = 68, bw = W * 0.665, bh = H - 90;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(bx + 4, by + 5, bw, bh, 12);
    bg.fillStyle(P.boardBg, 1);
    bg.fillRoundedRect(bx, by, bw, bh, 12);
    bg.lineStyle(2, P.boardBorder, 1);
    bg.strokeRoundedRect(bx, by, bw, bh, 12);
    // Accent corner
    bg.fillStyle(P.boardAccent, 1);
    bg.fillRoundedRect(bx, by, bw, 5, { tl: 12, tr: 12, bl: 0, br: 0 });

    // Subtle radial feel — lighter centre
    bg.fillStyle(0x2a4a2a, 0.06);
    bg.fillCircle(bx + bw/2, by + bh/2, Math.min(bw, bh) * 0.55);

    this._boardX = bx; this._boardY = by;
    this._boardW = bw; this._boardH = bh;
  }

  /* ─────────── ARROW LAYER ─────────── */
  _buildArrowLayer(W, H) {
    this.arrowGfxGlow  = this.add.graphics().setDepth(2);
    this.arrowGfx      = this.add.graphics().setDepth(3);
    this.particleGfx   = this.add.graphics().setDepth(4);
    this.previewGfx    = this.add.graphics().setDepth(4);

    // Live preview line following mouse
    this.input.on("pointermove", (p) => {
      this.previewGfx.clear();
      if (!this.selected) return;
      const A = this._nodeSprites.get(this.selected);
      if (!A) return;
      this.previewGfx.lineStyle(2, P.selectedGlow, 0.4);
      this.previewGfx.lineBetween(A.x, A.y, p.x, p.y);
    });
  }

  /* ─────────── NODES ─────────── */
  _buildNodes(W, H) {
    const positions = this._layoutPositions(W, H);
    this._nodeSprites = new Map();

    this.nodes.forEach((name, i) => {
      const p = positions[i % positions.length];
      const tier = getTier(name);
      const colors = tierColors(tier);

      // Outer glow ring (hidden, revealed on hover/select)
      const glowRing = this.add.graphics().setDepth(5);
      glowRing.fillStyle(colors.glow, 0.18);
      glowRing.fillCircle(p.x, p.y, 52);
      glowRing.setAlpha(0);

      // Node card background
      const cw = 148, ch = 46;
      const cardGfx = this.add.graphics().setDepth(6);
      this._drawNodeCard(cardGfx, 0, 0, cw, ch, colors, false, false);
      cardGfx.x = p.x - cw/2;
      cardGfx.y = p.y - ch/2;

      // Emoji tier icon
      const emoji = this.add.text(p.x - cw/2 + 10, p.y, tierEmoji(tier), { fontSize: "16px" })
        .setOrigin(0, 0.5).setDepth(8);

      // Node name
      const txt = this.add.text(p.x + 4, p.y, name, {
        fontFamily: "'Courier New', monospace",
        fontSize: name.length > 10 ? "11px" : "13px",
        color: `#${colors.text.toString(16).padStart(6,"0")}`,
        align: "center",
        wordWrap: { width: cw - 36 }
      }).setOrigin(0, 0.5).setDepth(8);

      // Invisible hit zone
      const hit = this.add.rectangle(p.x, p.y, cw + 8, ch + 8, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true })
        .setDepth(9);

      hit.on("pointerover", () => {
        this.tweens.add({ targets: glowRing, alpha: 1, duration: 180 });
        this.tweens.add({ targets: cardGfx, alpha: 0.85, duration: 120 });
        if (this.selected && this.selected !== name) {
          this._drawNodeCard(cardGfx, 0, 0, cw, ch, colors, false, true);
        }
      });
      hit.on("pointerout", () => {
        if (this.selected !== name) {
          this.tweens.add({ targets: glowRing, alpha: 0, duration: 300 });
        }
        this.tweens.add({ targets: cardGfx, alpha: 1, duration: 180 });
        this._refreshNode(name);
      });
      hit.on("pointerdown", () => this._onClickNode(name));

      // Staggered intro pop
      cardGfx.setScale(0.6).setAlpha(0);
      emoji.setAlpha(0); txt.setAlpha(0);
      this.tweens.add({ targets: [cardGfx, emoji, txt], scale: 1, alpha: 1,
        duration: 400, delay: 60 + i * 80, ease: "Back.Out" });

      this._nodeSprites.set(name, {
        x: p.x, y: p.y, cw, ch,
        cardGfx, glowRing, emoji, txt, hit,
        tier, colors
      });
    });
  }

  _drawNodeCard(g, x, y, w, h, colors, selected, hoverTarget) {
    g.clear();
    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(x + 3, y + 4, w, h, 10);
    // Body
    g.fillStyle(colors.bg, 1);
    g.fillRoundedRect(x, y, w, h, 10);
    // Inner sheen
    g.fillStyle(0xffffff, 0.08);
    g.fillRoundedRect(x + 4, y + 3, w - 8, h * 0.35, 7);
    // Border
    const borderCol = selected ? P.selectedRing : hoverTarget ? P.arrowUnverif : colors.border;
    const borderW   = selected ? 3 : hoverTarget ? 2 : 2;
    g.lineStyle(borderW, borderCol, 1);
    g.strokeRoundedRect(x, y, w, h, 10);
    // Selection ring glow
    if (selected) {
      g.lineStyle(5, P.selectedGlow, 0.25);
      g.strokeRoundedRect(x - 3, y - 3, w + 6, h + 6, 13);
    }
  }

  _refreshNode(name) {
    const n = this._nodeSprites.get(name);
    if (!n) return;
    const selected = this.selected === name;
    const connected = Array.from(this.links).some(k => k.startsWith(name + "→") || k.endsWith("→" + name));
    this._drawNodeCard(n.cardGfx, 0, 0, n.cw, n.ch, n.colors, selected, false);
    if (selected) {
      this.tweens.add({ targets: n.glowRing, alpha: 1, duration: 180 });
    } else if (!connected) {
      this.tweens.add({ targets: n.glowRing, alpha: 0, duration: 300 });
    }
  }

  _layoutPositions(W, H) {
    // Organic multi-tier layout within board bounds
    const bx = this._boardX + 36, by = this._boardY + 28;
    const bw = this._boardW - 72, bh = this._boardH - 56;

    const count = this.nodes.length;
    if (count <= 4) {
      // Single row
      return Array.from({ length: count }, (_, i) => ({
        x: bx + (i + 0.5) * (bw / count),
        y: by + bh / 2
      }));
    }
    // Elliptical web layout
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const rx = bw * 0.42, ry = bh * 0.42;
      return {
        x: bx + bw/2 + Math.cos(angle) * rx,
        y: by + bh/2 + Math.sin(angle) * ry * 0.8
      };
    });
  }

  /* ─────────── CLICK LOGIC ─────────── */
  _onClickNode(name) {
    this.previewGfx.clear();

    if (!this.selected) {
      this.selected = name;
      this._refreshNode(name);
      this._updateHint(`Selected: "${name}" — now click what eats it ➜`);
      return;
    }
    if (this.selected === name) {
      this.selected = null;
      this._refreshNode(name);
      this._updateHint("Click a food source to begin drawing an arrow.");
      return;
    }

    const key = `${this.selected}→${name}`;
    const prev = this.selected;
    const wasLinked = this.links.has(key);

    if (wasLinked) this.links.delete(key);
    else {
      this.links.add(key);
      this._spawnFlowBurst(prev, name);
    }

    this.selected = null;
    this._refreshNode(prev);
    this._refreshNode(name);
    this._redraw();

    const action = wasLinked ? "removed" : "added";
    const correct = this.correctLinks.has(key);
    if (!wasLinked) {
      this._updateHint(correct
        ? `✅ Correct! "${prev}" is eaten by "${name}".`
        : `❌ "${prev}" → "${name}" may not be right. Try again!`);
    } else {
      this._updateHint(`Link removed. Links made: ${this.links.size}`);
    }
  }

  /* ─────────── REDRAW ARROWS ─────────── */
  _redraw() {
    const gGlow = this.arrowGfxGlow;
    const g = this.arrowGfx;
    gGlow.clear();
    g.clear();

    for (const key of this.links) {
      const [a, b] = key.split("→");
      const A = this._nodeSprites.get(a);
      const B = this._nodeSprites.get(b);
      if (!A || !B) continue;

      const isCorrect = this.correctLinks.size > 0
        ? this.correctLinks.has(key) ? "correct" : "wrong"
        : "unverified";

      const arrowColor = isCorrect === "correct" ? P.arrowCorrect
                       : isCorrect === "wrong"   ? P.arrowWrong
                       :                           P.arrowUnverif;

      // Offset endpoints to card edges
      const angle = Phaser.Math.Angle.Between(A.x, A.y, B.x, B.y);
      const startR = 28, endR = 32;
      const sx = A.x + Math.cos(angle) * startR;
      const sy = A.y + Math.sin(angle) * startR;
      const ex = B.x - Math.cos(angle) * endR;
      const ey = B.y - Math.sin(angle) * endR;

      // Glow
      gGlow.lineStyle(10, arrowColor, 0.1);
      gGlow.lineBetween(sx, sy, ex, ey);

      // Main line
      g.lineStyle(3, arrowColor, 0.9);
      g.lineBetween(sx, sy, ex, ey);

      // Arrowhead (filled triangle)
      const hx = ex, hy = ey;
      const al = 14, aw = 7;
      const lx1 = hx - Math.cos(angle - 0.5) * al, ly1 = hy - Math.sin(angle - 0.5) * al;
      const lx2 = hx - Math.cos(angle + 0.5) * al, ly2 = hy - Math.sin(angle + 0.5) * al;
      g.fillStyle(arrowColor, 1);
      g.fillTriangle(hx, hy, lx1, ly1, lx2, ly2);

      // Dot at origin
      g.fillStyle(arrowColor, 0.7);
      g.fillCircle(sx, sy, 4);
    }
  }

  /* ─────────── ENERGY FLOW PARTICLES ─────────── */
  _spawnFlowBurst(fromName, toName) {
    const A = this._nodeSprites.get(fromName);
    const B = this._nodeSprites.get(toName);
    if (!A || !B) return;

    const count = 5;
    const colors = [P.particleA, P.particleB, P.particleC];
    for (let i = 0; i < count; i++) {
      const dot = this.add.circle(A.x, A.y, 4, Phaser.Utils.Array.GetRandom(colors), 1).setDepth(10);
      const delay = i * 80;
      this.tweens.add({
        targets: dot,
        x: B.x, y: B.y,
        alpha: 0,
        scale: 0.4,
        duration: 500,
        delay,
        ease: "Cubic.In",
        onComplete: () => dot.destroy()
      });
    }
  }

  /* ─────────── PANEL ─────────── */
  _buildPanel(W, H) {
    const px = this._boardX + this._boardW + 8;
    const py = 68;
    const pw = W - px - 14;
    const ph = H - 88;

    this._panelX = px; this._panelY = py;
    this._panelW = pw; this._panelH = ph;

    const pg = this.add.graphics();
    pg.fillStyle(0x000000, 0.35);
    pg.fillRoundedRect(px + 3, py + 5, pw, ph, 10);
    pg.fillStyle(P.panelBg, 1);
    pg.fillRoundedRect(px, py, pw, ph, 10);
    pg.lineStyle(2, P.panelBorder, 1);
    pg.strokeRoundedRect(px, py, pw, ph, 10);
    pg.fillStyle(P.panelAccent, 1);
    pg.fillRoundedRect(px, py, pw, 5, { tl: 10, tr: 10, bl: 0, br: 0 });

    const cx = px + pw/2;
    this.add.text(cx, py + 18, "WEB METER", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#5acd6a", letterSpacing: 3
    }).setOrigin(0.5);

    // LCD rows
    const lcdRow = (label, yy) => {
      const lh = 30, lx = px + 8, lw = pw - 16;
      const lg = this.add.graphics();
      lg.fillStyle(P.lcdBg, 1);
      lg.fillRoundedRect(lx, yy, lw, lh, 5);
      lg.lineStyle(1, P.panelBorder, 0.8);
      lg.strokeRoundedRect(lx, yy, lw, lh, 5);
      this.add.text(lx + 5, yy + 4, label, {
        fontFamily: "'Courier New', monospace", fontSize: "8px",
        color: "#1a3a1a", letterSpacing: 1
      });
      return this.add.text(lx + lw - 5, yy + lh/2, "—", {
        fontFamily: "'Courier New', monospace", fontSize: "13px",
        color: "#88ff44"
      }).setOrigin(1, 0.5);
    };

    let ry = py + 32;
    this._lcdLinks    = lcdRow("LINKS MADE",   ry); ry += 36;
    this._lcdCorrect  = lcdRow("CORRECT",      ry); ry += 36;
    this._lcdMissing  = lcdRow("REMAINING",    ry); ry += 36;

    // ── Accuracy arc meter ──
    this.add.text(cx, ry + 6, "ACCURACY", {
      fontFamily: "'Courier New', monospace", fontSize: "9px",
      color: "#2a5a2a", letterSpacing: 2
    }).setOrigin(0.5);
    ry += 20;

    this._meterCX = cx; this._meterCY = ry + 52;
    this._buildArcMeter(cx, ry + 52, 46);
    ry += 112;

    // ── Clear button ──
    this.clearBtnGfx = this.add.graphics();
    this._drawClearBtn(false);
    this.clearBtnLabel = this.add.text(cx, ry, "🧹  Clear All", {
      fontFamily: "'Courier New', monospace", fontSize: "12px",
      color: "#6a9a6a"
    }).setOrigin(0.5);

    const clearHit = this.add.rectangle(cx, ry, pw - 20, 30, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    clearHit.on("pointerover",  () => { this._drawClearBtn(true);  this.clearBtnLabel.setColor("#e0f8e0"); });
    clearHit.on("pointerout",   () => { this._drawClearBtn(false); this.clearBtnLabel.setColor("#6a9a6a"); });
    clearHit.on("pointerdown",  () => this._clearAll());

    this._clearBtnY = ry;
  }

  _drawClearBtn(hovered) {
    const g = this.clearBtnGfx;
    g.clear();
    const { _panelX: px, _panelW: pw, _clearBtnY: cy } = this;
    const bw = pw - 20;
    g.fillStyle(hovered ? 0x1a3a1a : 0x0a1a0a, 1);
    g.fillRoundedRect(px + 10, cy - 15, bw, 30, 6);
    g.lineStyle(1.5, hovered ? P.panelAccent : P.panelBorder, 1);
    g.strokeRoundedRect(px + 10, cy - 15, bw, 30, 6);
  }

  _buildArcMeter(cx, cy, r) {
    // Background arc
    const bg = this.add.graphics();
    bg.lineStyle(10, P.meterBg, 1);
    bg.beginPath();
    bg.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25, false);
    bg.strokePath();

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      const ir = r - 6, or = r + 6;
      bg.lineStyle(i % 5 === 0 ? 2 : 1, P.textMid, i % 5 === 0 ? 0.7 : 0.35);
      bg.lineBetween(cx + Math.cos(angle) * ir, cy + Math.sin(angle) * ir,
                     cx + Math.cos(angle) * or, cy + Math.sin(angle) * or);
    }

    this.arcGfx = this.add.graphics();
    this.arcNeedle = this.add.graphics();
    this.arcLabel = this.add.text(cx, cy + 14, "0%", {
      fontFamily: "'Georgia', serif", fontSize: "18px",
      color: "#88ff44", fontStyle: "bold"
    }).setOrigin(0.5);

    this._arcR = r;
    this._updateArcMeter(0);
  }

  _updateArcMeter(pct) {
    const cx = this._meterCX, cy = this._meterCY, r = this._arcR;
    const g = this.arcGfx;
    g.clear();

    const startAngle = Math.PI * 0.75;
    const endAngle   = startAngle + (pct / 100) * Math.PI * 1.5;
    const col = pct >= 80 ? P.meterHigh : pct >= 50 ? P.meterMid : P.meterLow;

    g.lineStyle(10, col, 0.9);
    if (pct > 0) {
      g.beginPath();
      g.arc(cx, cy, r, startAngle, endAngle, false);
      g.strokePath();
    }

    // Needle
    const an = this.arcNeedle;
    an.clear();
    const needleAngle = startAngle + (pct / 100) * Math.PI * 1.5;
    an.lineStyle(2.5, 0xffffff, 0.9);
    an.lineBetween(cx, cy, cx + Math.cos(needleAngle) * (r - 4), cy + Math.sin(needleAngle) * (r - 4));
    an.fillStyle(0xffffff, 1);
    an.fillCircle(cx, cy, 4);

    const colHex = `#${col.toString(16).padStart(6, "0")}`;
    this.arcLabel.setText(`${Math.round(pct)}%`).setColor(colHex);
  }

  _clearAll() {
    this.links.clear();
    this.selected = null;
    this._nodeSprites.forEach((_, name) => this._refreshNode(name));
    this.previewGfx.clear();
    this._redraw();
    this._updateHint("All links cleared. Click a node to start again.");
  }

  /* ─────────── HEADER ─────────── */
  _buildHeader(W, H) {
    const hg = this.add.graphics().setDepth(12);
    hg.fillStyle(P.panelBg, 0.92);
    hg.fillRoundedRect(this._boardX, 6, this._boardW, 56, 8);
    hg.lineStyle(1.5, P.boardBorder, 1);
    hg.strokeRoundedRect(this._boardX, 6, this._boardW, 56, 8);
    hg.fillStyle(P.boardAccent, 1);
    hg.fillRect(this._boardX, 6, 4, 56);

    this.add.text(this._boardX + 14, 12, "LAB 10", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#5acd6a", letterSpacing: 3
    }).setDepth(13);
    this.add.text(this._boardX + 14, 28, "Food Web Builder", {
      fontFamily: "'Georgia', serif", fontSize: "19px",
      color: "#e0f8e0", fontStyle: "bold"
    }).setDepth(13);

    this._hintEl = this.add.text(this._boardX + 14, 52, "Click a food source, then click its consumer to draw an arrow.", {
      fontFamily: "'Courier New', monospace", fontSize: "10px",
      color: "#4a7a4a"
    }).setDepth(13);
  }

  _updateHint(text) {
    if (this._hintEl) this._hintEl.setText(text);
  }

  /* ─────────── LEGEND ─────────── */
  _buildLegend(W, H) {
    const lx = this._panelX, ly = this._panelY + this._panelH - 90;
    const lw = this._panelW;

    this.add.text(lx + lw/2, ly, "TIER KEY", {
      fontFamily: "'Courier New', monospace", fontSize: "8px",
      color: "#2a5a2a", letterSpacing: 2
    }).setOrigin(0.5);

    const tiers = [
      { tier: "producer",  label: "Producer" },
      { tier: "herbivore", label: "Herbivore" },
      { tier: "carnivore", label: "Carnivore" },
      { tier: "omnivore",  label: "Omnivore" },
    ];
    tiers.forEach(({ tier, label }, i) => {
      const c = tierColors(tier);
      const ty = ly + 14 + i * 16;
      const lg = this.add.graphics();
      lg.fillStyle(c.border, 1);
      lg.fillCircle(lx + 16, ty + 5, 5);
      this.add.text(lx + 26, ty, `${tierEmoji(tier)} ${label}`, {
        fontFamily: "'Courier New', monospace", fontSize: "10px",
        color: `#${c.text.toString(16).padStart(6,"0")}`
      });
    });
  }

  /* ─────────── COMPLETION OVERLAY ─────────── */
  _buildCompletionOverlay(W, H) {
    this._completionGroup = this.add.group();

    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6).setDepth(30).setAlpha(0);
    const panel = this.add.graphics().setDepth(31);
    panel.fillStyle(P.panelBg, 0.98);
    panel.fillRoundedRect(W/2 - 170, H/2 - 100, 340, 200, 16);
    panel.lineStyle(3, P.panelAccent, 1);
    panel.strokeRoundedRect(W/2 - 170, H/2 - 100, 340, 200, 16);

    this._completionEmoji = this.add.text(W/2, H/2 - 62, "🌿", { fontSize: "40px" }).setOrigin(0.5).setDepth(32).setAlpha(0);
    this._completionTitle = this.add.text(W/2, H/2 - 14, "Food Web Complete!", {
      fontFamily: "'Georgia', serif", fontSize: "22px", color: "#5acd6a", fontStyle: "bold"
    }).setOrigin(0.5).setDepth(32).setAlpha(0);
    this._completionSub = this.add.text(W/2, H/2 + 22, "", {
      fontFamily: "'Courier New', monospace", fontSize: "13px", color: "#88aa88", align: "center"
    }).setOrigin(0.5).setDepth(32).setAlpha(0);

    const retryBtn = this.add.text(W/2, H/2 + 72, "↩  Try Again", {
      fontFamily: "'Courier New', monospace", fontSize: "14px", color: "#5acd6a"
    }).setOrigin(0.5).setDepth(32).setAlpha(0).setInteractive({ useHandCursor: true });
    retryBtn.on("pointerdown", () => this._clearAll());
    retryBtn.on("pointerover",  () => retryBtn.setColor("#88ff44"));
    retryBtn.on("pointerout",   () => retryBtn.setColor("#5acd6a"));

    this._completionGroup.addMultiple([overlay, this._completionEmoji, this._completionTitle, this._completionSub, retryBtn]);
    this._completionOverlay = overlay;
    this._completionRetry = retryBtn;
  }

  _showCompletion(correct, total) {
    if (this._completionShown) return;
    this._completionShown = true;
    const pct = Math.round((correct / total) * 100);
    this._completionSub.setText(`${correct} / ${total} correct links  ·  ${pct}% accuracy`);
    this._completionTitle.setText(pct === 100 ? "Perfect Web! 🌟" : pct >= 70 ? "Great work!" : "Keep exploring!");

    [this._completionOverlay, this._completionEmoji, this._completionTitle,
     this._completionSub, this._completionRetry].forEach(t =>
      this.tweens.add({ targets: t, alpha: 1, duration: 350, ease: "Sine.Out" })
    );
    this.tweens.add({ targets: this._completionEmoji, scale: 1.3, yoyo: true, repeat: 3, duration: 300 });
  }

  /* ─────────── FLOW PARTICLES (update) ─────────── */
  _tickFlowParticles(time) {
    if (this.links.size === 0) return;
    if (Math.random() > 0.08) return;

    const keys = Array.from(this.links);
    const key = Phaser.Utils.Array.GetRandom(keys);
    const [a, b] = key.split("→");
    const A = this._nodeSprites.get(a), B = this._nodeSprites.get(b);
    if (!A || !B) return;

    const dot = this.add.circle(A.x, A.y, 3, Phaser.Utils.Array.GetRandom([P.particleA, P.particleB]), 0.85).setDepth(7);
    this.tweens.add({
      targets: dot,
      x: B.x, y: B.y,
      alpha: 0, scale: 0.3,
      duration: Phaser.Math.Between(600, 1000),
      ease: "Sine.InOut",
      onComplete: () => dot.destroy()
    });
  }

  /* ─────────── UPDATE ─────────── */
  update(time) {
    const total   = this.correctLinks.size || 1;
    let correct = 0, wrong = 0;

    for (const l of this.links) {
      if (this.correctLinks.has(l)) correct++;
      else wrong++;
    }

    const pct = Math.round((correct / total) * 100);
    const remaining = Math.max(0, this.correctLinks.size - correct);

    // LCD updates
    this._lcdLinks.setText(`${this.links.size}`);
    this._lcdCorrect.setText(`${correct} / ${this.correctLinks.size}`)
      .setColor(correct === this.correctLinks.size ? "#88ff44" : "#ffee44");
    this._lcdMissing.setText(`${remaining}`)
      .setColor(remaining === 0 ? "#88ff44" : "#ffcc44");

    // Accuracy arc
    this._updateArcMeter(pct);

    // Animate selected node pulse
    if (this.selected) {
      const n = this._nodeSprites.get(this.selected);
      if (n) {
        const pulse = 0.7 + Math.sin(time / 200) * 0.3;
        n.glowRing.setAlpha(pulse);
      }
    }

    // Energy flow particles
    this._tickFlowParticles(time);

    // Completion check
    if (this.correctLinks.size > 0 && correct === this.correctLinks.size && this.links.size === this.correctLinks.size) {
      if (!this._completionShown) this._showCompletion(correct, this.correctLinks.size);
    } else if (this._completionShown && this.links.size < this.correctLinks.size) {
      this._completionShown = false;
      this._completionGroup.getChildren().forEach(c => c.setAlpha(0));
    }

    this.emitMeasurement({
      linksMade:    this.links.size,
      correctLinks: correct,
      accuracy:     `${pct}%`,
    });
  }
}