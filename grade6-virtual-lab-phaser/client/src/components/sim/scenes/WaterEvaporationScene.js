// import Phaser from "phaser";
// import BaseLabScene from "./BaseLabScene.js";

// export default class WaterEvaporationScene extends BaseLabScene {
//   constructor(opts) {
//     super("WaterEvaporationScene", opts);
//     this.level = opts.labConfig?.startLevel ?? 100;
//     this.temp = opts.labConfig?.temp ?? 30;
//     this.wind = opts.labConfig?.wind ?? 0;
//   }

//   create() {
//     const W = this.scale.width;

//     this.label(30, 20, "Press ↑/↓ to change temperature, ←/→ to change wind.");

//     this.add.rectangle(W / 2, 260, 650, 250, 0xffffff).setStrokeStyle(2, 0xe1e1f0);

//     this.water = this.add.rectangle(W / 2, 360, 630, 200, 0x4aa3ff, 0.25);
//     this.wave = this.add.rectangle(W / 2, 260, 630, 8, 0x4aa3ff, 0.5);

//     this.info = this.label(700, 90, "");

//     this.input.keyboard.on("keydown-UP", () => this.temp = Phaser.Math.Clamp(this.temp + 2, 0, 100));
//     this.input.keyboard.on("keydown-DOWN", () => this.temp = Phaser.Math.Clamp(this.temp - 2, 0, 100));
//     this.input.keyboard.on("keydown-RIGHT", () => this.wind = Phaser.Math.Clamp(this.wind + 1, 0, 10));
//     this.input.keyboard.on("keydown-LEFT", () => this.wind = Phaser.Math.Clamp(this.wind - 1, 0, 10));
//   }

//   update(time, delta) {
//     const dt = delta / 1000;

//     const rate = (this.temp * 0.03 + this.wind * 0.15) * dt;
//     this.level = Math.max(0, this.level - rate);

//     const maxH = 200;
//     const h = (this.level / 100) * maxH;
//     this.water.height = Math.max(0, h);
//     this.water.y = 360 + (maxH - h) / 2;

//     this.wave.y = this.water.y - this.water.height / 2;
//     this.wave.width = 630 - (this.wind * 8);
//     this.wave.alpha = 0.35 + 0.15 * Math.sin(time / 140);

//     const note = this.temp < 30 ? "Slow 🐢" : this.temp < 70 ? "Medium 🚶" : "Fast 🏃💨";

//     this.info.setText(
//       `Temperature: ${this.temp}°C\nWind: ${this.wind}\nWater Level: ${this.level.toFixed(1)}%\nEvaporation: ${note}`
//     );

//     this.emitMeasurement({
//       temp: this.temp,
//       wind: this.wind,
//       waterLevel: this.level.toFixed(1),
//       note
//     });
//   }
// }
