import Phaser from "phaser";

export default class BaseLabScene extends Phaser.Scene {
  constructor(key, opts = {}) {
    super(key);
    this.labConfig = opts.labConfig ?? {};
  }

  emitMeasurement(payload) {
    this.game?.events?.emit("MEASUREMENT", payload);
  }

  label(x, y, text) {
    return this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#1a1a1a"
    });
  }
}
