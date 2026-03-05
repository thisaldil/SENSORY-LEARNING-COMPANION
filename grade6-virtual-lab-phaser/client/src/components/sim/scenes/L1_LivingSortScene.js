import Phaser from "phaser";
import BaseLabScene from "./BaseLabScene.js";

const PALETTE = {
  bg: 0xf0f7ee,
  ground: 0xc8e6c9,
  livingBg: 0xd4edda,
  livingBorder: 0x4caf50,
  livingBorderDark: 0x2e7d32,
  nonBg: 0xdce8f8,
  nonBorder: 0x5c8dc9,
  nonBorderDark: 0x1a4a8a,
  cardBg: 0xffffff,
  cardBorder: 0xdde3ec,
  cardShadow: 0xb0bec5,
  textDark: 0x1b2a1e,
  textMid: 0x4a5568,
  correct: 0x43a047,
  wrong: 0xe53935,
  gold: 0xffc107,
  sky1: 0xb3d9f7,
  sky2: 0xe8f5e9,
  sun: 0xffeb3b,
  sunGlow: 0xfff9c4,
};

export default class L1_LivingSortScene extends BaseLabScene {
  constructor(opts) {
    super("L1_LivingSortScene", opts);
    this.items = opts.labConfig?.items ?? [];
    this.placed = new Map();
    this._lastAcc = -1;
  }

  /* ─────────────── PRELOAD ─────────────── */
  preload() {
    // Generate textures programmatically — no external assets needed
  }

  /* ─────────────── CREATE ─────────────── */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._buildBackground(W, H);
    this._buildHeader(W);
    this._buildDropZones(W);
    this._buildCards(W, H);
    this._buildStatusBar(W, H);
    this._hookDrag();
  }

  /* ─────── background ─────── */
  _buildBackground(W, H) {
    // Sky gradient via two layered rects
    this.add.rectangle(W / 2, H * 0.35, W, H * 0.7, PALETTE.sky1);
    this.add.rectangle(W / 2, H * 0.7, W, H * 0.6, PALETTE.sky2);

    // Ground strip
    this.add.rectangle(W / 2, H - 18, W, 36, PALETTE.ground);

    // Decorative clouds
    this._cloud(80, 55, 0.7);
    this._cloud(W - 130, 45, 0.55);
    this._cloud(W * 0.5, 35, 0.45);

    // Sun with animated halo
    this.sunGlow = this.add.circle(W - 68, 58, 38, PALETTE.sunGlow, 0.6);
    this.sunCore = this.add.circle(W - 68, 58, 26, PALETTE.sun, 1);
    this.sunRays = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const line = this.add.line(
        W - 68 + Math.cos(angle) * 38,
        58 + Math.sin(angle) * 38,
        0, 0,
        Math.cos(angle) * 10,
        Math.sin(angle) * 10,
        PALETTE.sun, 0.8
      ).setLineWidth(2);
      this.sunRays.push({ line, angle, baseAngle: angle });
    }

    // Floating leaves / particles
    this.floatingItems = [];
    const emojis = ["🍃", "🌿", "✨", "🌱"];
    for (let i = 0; i < 6; i++) {
      const t = this.add.text(
        Phaser.Math.Between(20, W - 20),
        Phaser.Math.Between(H * 0.55, H - 40),
        Phaser.Utils.Array.GetRandom(emojis),
        { fontSize: "14px" }
      ).setAlpha(0.35);
      this.floatingItems.push({ text: t, speed: 0.2 + Math.random() * 0.3, offset: Math.random() * Math.PI * 2 });
    }
  }

  _cloud(x, y, scale) {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.85);
    [[0, 0, 22], [-24, 8, 18], [24, 8, 18], [-12, 12, 16], [12, 12, 16]].forEach(([dx, dy, r]) =>
      g.fillCircle(x + dx * scale, y + dy * scale, r * scale)
    );
  }

  /* ─────── header ─────── */
  _buildHeader(W) {
    // Frosted pill header
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0xffffff, 0.7);
    headerBg.fillRoundedRect(12, 8, W - 24, 52, 14);
    headerBg.lineStyle(1.5, 0xc8e6c9, 1);
    headerBg.strokeRoundedRect(12, 8, W - 24, 52, 14);

    this.add.text(22, 15, "🌿  Lesson 1", {
      fontFamily: "'Georgia', serif",
      fontSize: "13px",
      color: "#4a7c59",
      fontStyle: "italic",
    });
    this.add.text(22, 33, "Living vs Non-living", {
      fontFamily: "'Georgia', serif",
      fontSize: "20px",
      color: "#1b2a1e",
      fontStyle: "bold",
    });
    this.add.text(W - 18, 20, "Drag each card to the correct box", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#607060",
      align: "right",
    }).setOrigin(1, 0);
  }

  /* ─────── drop zones ─────── */
  _buildDropZones(W) {
    const boxY = 135;
    const boxW = Math.min(W * 0.4, 300);
    const boxH = 130;
    const lx = W * 0.27;
    const rx = W * 0.73;

    // Living box
    this._drawZoneBox(lx, boxY, boxW, boxH, PALETTE.livingBg, PALETTE.livingBorder, PALETTE.livingBorderDark);
    this.add.text(lx, boxY - 54, "🌱", { fontSize: "26px" }).setOrigin(0.5);
    this.add.text(lx, boxY - 30, "LIVING", {
      fontFamily: "'Georgia', serif",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#2e7d32",
    }).setOrigin(0.5);

    // Non-living box
    this._drawZoneBox(rx, boxY, boxW, boxH, PALETTE.nonBg, PALETTE.nonBorder, PALETTE.nonBorderDark);
    this.add.text(rx, boxY - 54, "🪨", { fontSize: "26px" }).setOrigin(0.5);
    this.add.text(rx, boxY - 30, "NON-LIVING", {
      fontFamily: "'Georgia', serif",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#1a4a8a",
    }).setOrigin(0.5);

    // Store refs for hit testing
    this.livingZone = { x: lx, y: boxY, w: boxW, h: boxH };
    this.nonZone = { x: rx, y: boxY, w: boxW, h: boxH };

    // Zone highlights (hidden until drag starts)
    this.livingHighlight = this.add.rectangle(lx, boxY, boxW, boxH, PALETTE.livingBorder, 0)
      .setStrokeStyle(0);
    this.nonHighlight = this.add.rectangle(rx, boxY, boxW, boxH, PALETTE.nonBorder, 0)
      .setStrokeStyle(0);

    // Tip label
    this.add.text(W / 2, boxY + boxH / 2 + 16, "💡 Living things grow, eat, breathe, and reproduce.", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#6a7d6a",
      align: "center",
    }).setOrigin(0.5);
  }

  _drawZoneBox(x, y, w, h, fill, borderLight, borderDark) {
    const g = this.add.graphics();
    // Shadow
    g.fillStyle(0x000000, 0.06);
    g.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 5, w, h, 16);
    // Fill
    g.fillStyle(fill, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 16);
    // Inner subtle gradient stripe
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, (h - 12) * 0.4, 10);
    // Border
    g.lineStyle(2.5, borderLight, 1);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 16);
    g.lineStyle(1.5, borderDark, 0.3);
    g.strokeRoundedRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, 13);
    return g;
  }

  /* ─────── cards ─────── */
  _buildCards(W, H) {
    const CARD_W = 150;
    const CARD_H = 50;
    const cols = 4;
    const gapX = 168;
    const gapY = 66;
    const startX = W / 2 - ((Math.min(this.items.length, cols) - 1) * gapX) / 2;
    const startY = 275;

    this.cards = [];

    this.items.forEach((it, i) => {
      const x = startX + (i % cols) * gapX;
      const y = startY + Math.floor(i / cols) * gapY;

      const cardGroup = this._makeCard(x, y, it.name, CARD_W, CARD_H);
      cardGroup.data = {
        name: it.name,
        answer: it.answer,
        homeX: x,
        homeY: y,
        placed: false,
      };

      // Staggered intro animation
      cardGroup.container.setScale(0.7).setAlpha(0);
      this.tweens.add({
        targets: cardGroup.container,
        scale: 1,
        alpha: 1,
        duration: 350,
        delay: 80 + i * 55,
        ease: "Back.Out",
      });

      this.input.setDraggable(cardGroup.hitTarget);
      this.cards.push(cardGroup);
    });
  }

  _makeCard(x, y, name, w, h) {
    // Graphics for card face
    const g = this.add.graphics();
    this._drawCardFace(g, w, h, false);
    g.generateTexture(`card_${name}`, w + 8, h + 8);
    g.destroy();

    const img = this.add.image(x, y, `card_${name}`).setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, name, {
      fontFamily: "'Georgia', serif",
      fontSize: "14px",
      color: "#1b2a1e",
      align: "center",
      wordWrap: { width: w - 16 },
    }).setOrigin(0.5);

    // Feedback icon (hidden initially)
    const icon = this.add.text(x + w / 2 - 10, y - h / 2 + 4, "", { fontSize: "14px" }).setOrigin(0.5);

    // Container to group card visuals
    const container = this.add.container(0, 0, [img, txt, icon]);

    return { container, hitTarget: img, img, txt, icon, data: null };
  }

  _drawCardFace(g, w, h, highlighted) {
    const shadowColor = highlighted ? 0x90caf9 : 0xb0bec5;
    const borderColor = highlighted ? 0x42a5f5 : 0xdde3ec;
    // shadow
    g.fillStyle(shadowColor, 0.25);
    g.fillRoundedRect(3, 5, w, h, 10);
    // fill
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, w, h, 10);
    // sheen stripe
    g.fillStyle(0xffffff, 0.5);
    g.fillRoundedRect(4, 3, w - 8, h * 0.3, 7);
    // border
    g.lineStyle(2, borderColor, 1);
    g.strokeRoundedRect(0, 0, w, h, 10);
  }

  /* ─────── drag & drop ─────── */
  _hookDrag() {
    this.input.on("dragstart", (pointer, target) => {
      const card = this._cardByTarget(target);
      if (!card) return;
      // Lift animation
      this.tweens.add({ targets: card.container, scale: 1.08, duration: 120, ease: "Quad.Out" });
      // Show zone highlights
      this.tweens.add({ targets: this.livingHighlight, fillAlpha: 0.12, duration: 200 });
      this.tweens.add({ targets: this.nonHighlight, fillAlpha: 0.12, duration: 200 });
      card.img.setDepth(10);
      card.txt.setDepth(11);
    });

    this.input.on("drag", (pointer, target, dragX, dragY) => {
      const card = this._cardByTarget(target);
      if (!card) return;
      card.img.x = dragX;
      card.img.y = dragY;
      card.txt.x = dragX;
      card.txt.y = dragY;
      card.icon.x = dragX + 60;
      card.icon.y = dragY - 16;

      // Pulse the hovered zone
      const overLiving = this._inZone(dragX, dragY, this.livingZone);
      const overNon = this._inZone(dragX, dragY, this.nonZone);
      this.livingHighlight.setFillStyle(PALETTE.livingBorder, overLiving ? 0.22 : 0.1);
      this.nonHighlight.setFillStyle(PALETTE.nonBorder, overNon ? 0.22 : 0.1);
    });

    this.input.on("dragend", (pointer, target) => {
      const card = this._cardByTarget(target);
      if (!card) return;

      this.tweens.add({ targets: card.container, scale: 1, duration: 120 });
      this.tweens.add({ targets: this.livingHighlight, fillAlpha: 0, duration: 300 });
      this.tweens.add({ targets: this.nonHighlight, fillAlpha: 0, duration: 300 });
      card.img.setDepth(0);
      card.txt.setDepth(1);

      const overLiving = this._inZone(card.img.x, card.img.y, this.livingZone);
      const overNon = this._inZone(card.img.x, card.img.y, this.nonZone);
      const choice = overLiving ? "living" : overNon ? "nonliving" : null;

      if (!choice) {
        this._snapHome(card);
        this.placed.delete(card.data.name);
        card.icon.setText("");
        return;
      }

      const zone = choice === "living" ? this.livingZone : this.nonZone;
      const tx = zone.x + Phaser.Math.Between(-zone.w / 2 + 50, zone.w / 2 - 50);
      const ty = zone.y + Phaser.Math.Between(-zone.h / 2 + 20, zone.h / 2 - 20);

      const correct = card.data.answer === choice;
      this.placed.set(card.data.name, choice);

      // Place with bounce
      this.tweens.add({
        targets: [card.img, card.txt],
        x: (target) => target === card.img ? tx : tx,
        y: (target) => target === card.img ? ty : ty,
        duration: 200,
        ease: "Back.Out",
        onUpdate: () => {
          card.txt.x = card.img.x;
          card.txt.y = card.img.y;
          card.icon.x = card.img.x + 60;
          card.icon.y = card.img.y - 18;
        }
      });

      // Tint and icon feedback
      card.icon.setText(correct ? "✅" : "❌");
      card.txt.setColor(correct ? "#2e7d32" : "#b71c1c");

      if (correct) {
        this._burstParticles(card.img.x, card.img.y, PALETTE.correct);
      } else {
        this._shakeCard(card);
      }

      this._checkComplete();
    });
  }

  _cardByTarget(target) {
    return this.cards.find(c => c.hitTarget === target) ?? null;
  }

  _inZone(x, y, zone) {
    return Math.abs(x - zone.x) < zone.w / 2 && Math.abs(y - zone.y) < zone.h / 2;
  }

  _snapHome(card) {
    this.tweens.add({
      targets: card.img,
      x: card.data.homeX,
      y: card.data.homeY,
      duration: 220,
      ease: "Quad.InOut",
      onUpdate: () => {
        card.txt.x = card.img.x;
        card.txt.y = card.img.y;
        card.icon.x = card.img.x + 60;
        card.icon.y = card.img.y - 18;
      }
    });
    card.txt.setColor("#1b2a1e");
    card.icon.setText("");
  }

  _shakeCard(card) {
    this.tweens.add({
      targets: card.img,
      x: card.img.x + 6,
      duration: 40,
      yoyo: true,
      repeat: 4,
      ease: "Sine.InOut",
      onUpdate: () => {
        card.txt.x = card.img.x;
      }
    });
  }

  _burstParticles(x, y, color) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(0, 0, 5);
    g.generateTexture("burst_dot", 10, 10);
    g.destroy();

    const ps = this.add.particles(x, y, "burst_dot", {
      speed: { min: 60, max: 130 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 12,
      emitting: false,
    });
    ps.explode();
    this.time.delayedCall(600, () => ps.destroy());
  }

  /* ─────── status bar ─────── */
  _buildStatusBar(W, H) {
    const barBg = this.add.graphics();
    barBg.fillStyle(0xffffff, 0.75);
    barBg.fillRoundedRect(12, H - 46, W - 24, 34, 10);
    barBg.lineStyle(1.5, 0xc8e6c9, 1);
    barBg.strokeRoundedRect(12, H - 46, W - 24, 34, 10);

    this.statusTxt = this.add.text(W / 2, H - 29, "", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#4a5568",
      align: "center",
    }).setOrigin(0.5);

    // Progress bar track
    this.add.rectangle(W / 2, H - 10, W * 0.6, 6, 0xdde3ec).setOrigin(0.5);
    this.progressBar = this.add.rectangle(W / 2 - W * 0.3, H - 10, 0, 6, PALETTE.correct).setOrigin(0, 0.5);

    // Completion overlay (hidden)
    this.completionGroup = this.add.group();
    this._buildCompletionOverlay(W, H);
    this.completionGroup.setVisible(false);
  }

  _buildCompletionOverlay(W, H) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45);
    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 0.97);
    panel.fillRoundedRect(W / 2 - 160, H / 2 - 90, 320, 180, 22);
    panel.lineStyle(3, PALETTE.livingBorder, 1);
    panel.strokeRoundedRect(W / 2 - 160, H / 2 - 90, 320, 180, 22);

    this.completionEmoji = this.add.text(W / 2, H / 2 - 55, "🎉", { fontSize: "40px" }).setOrigin(0.5);
    this.completionTitle = this.add.text(W / 2, H / 2, "Well done!", {
      fontFamily: "'Georgia', serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#2e7d32",
    }).setOrigin(0.5);
    this.completionSub = this.add.text(W / 2, H / 2 + 34, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#4a5568",
      align: "center",
    }).setOrigin(0.5);

    const restartBtn = this.add.text(W / 2, H / 2 + 72, "↩  Try Again", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#1565c0",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on("pointerover", () => restartBtn.setColor("#0d47a1"));
    restartBtn.on("pointerout", () => restartBtn.setColor("#1565c0"));
    restartBtn.on("pointerdown", () => this.scene.restart());

    this.completionGroup.addMultiple([overlay, panel, this.completionEmoji, this.completionTitle, this.completionSub, restartBtn]);
  }

  _checkComplete() {
    if (this.placed.size < this.items.length) return;
    const correct = this.items.filter(it => this.placed.get(it.name) === it.answer).length;
    const pct = Math.round((correct / this.items.length) * 100);

    this.completionSub.setText(`You got ${correct} / ${this.items.length} correct  (${pct}%)`);
    this.completionTitle.setText(pct === 100 ? "Perfect! 🌟" : pct >= 70 ? "Great work!" : "Keep practising!");
    this.completionGroup.setVisible(true);

    this.tweens.add({
      targets: this.completionEmoji,
      scale: 1.3,
      yoyo: true,
      repeat: 3,
      duration: 300,
      ease: "Sine.InOut",
    });
  }

  /* ─────── UPDATE ─────── */
  update(time) {
    // Rotate sun rays
    const t = time * 0.0008;
    this.sunRays.forEach(({ line, baseAngle }, i) => {
      const a = baseAngle + t;
      const cx = this.sunCore.x;
      const cy = this.sunCore.y;
      line.setTo(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32, cx + Math.cos(a) * 44, cy + Math.sin(a) * 44);
    });

    // Bob sun glow
    this.sunGlow.setScale(1 + Math.sin(t * 2) * 0.05);

    // Float leaves
    this.floatingItems.forEach(({ text, speed, offset }) => {
      text.y -= speed * 0.4;
      text.x += Math.sin(time * 0.001 + offset) * 0.3;
      if (text.y < -20) text.y = this.scale.height + 10;
    });

    // Progress bar & status
    const total = this.items.length || 1;
    const correct = this.items.filter(it => this.placed.get(it.name) === it.answer).length;
    const placed = this.placed.size;
    const acc = placed === 0 ? 0 : Math.round((correct / placed) * 100);

    const barMaxW = this.scale.width * 0.6;
    const targetW = (placed / total) * barMaxW;
    this.progressBar.width += (targetW - this.progressBar.width) * 0.1;
    this.progressBar.setFillStyle(acc >= 80 ? PALETTE.correct : PALETTE.wrong);

    this.statusTxt.setText(
      placed === 0
        ? "Drag the cards above into the Living or Non-living box"
        : `Placed ${placed} / ${total}  ·  Correct ${correct}  ·  Accuracy ${acc}%`
    );

    this.emitMeasurement({ placed, correct, accuracy: `${acc}%` });
  }
}