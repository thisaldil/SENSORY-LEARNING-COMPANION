// import Phaser from "phaser";
// import BaseLabScene from "./BaseLabScene.js";

// export default class BuoyancyScene extends BaseLabScene {
//   constructor(opts) {
//     super("BuoyancyScene", opts);
//     this.waterDensity = opts.labConfig?.waterDensity ?? 1.0;
//     this.blockDensity = opts.labConfig?.block?.density ?? 0.8;
//     this.blockSize = opts.labConfig?.block?.size ?? 90;
//   }

//   create() {
//     const W = this.scale.width;
//     const H = this.scale.height;

//     this.waterY = 220;

//     // tank
//     this.add.rectangle(W / 2, H / 2 + 10, 760, 320, 0xffffff).setStrokeStyle(2, 0xe1e1f0);
//     this.add.rectangle(W / 2, this.waterY + (H - this.waterY) / 2, 740, H - this.waterY - 40, 0x4aa3ff, 0.18);

//     // waterline
//     this.add.line(0, 0, 40, this.waterY, W - 40, this.waterY, 0x4aa3ff, 0.8).setLineWidth(3);

//     // ruler marks
//     for (let i = 0; i <= 10; i++) {
//       const y = 60 + i * 30;
//       this.add.line(0, 0, 70, y, 90, y, 0x999999, 0.7).setLineWidth(2);
//     }
//     this.label(55, 40, "Ruler");

//     // block texture
//     const g = this.add.graphics();
//     g.fillStyle(0xffc857, 1);
//     g.fillRoundedRect(0, 0, 90, 90, 14);
//     g.generateTexture("blockTex", 90, 90);
//     g.destroy();

//     // ground texture
//     const g2 = this.add.graphics();
//     g2.fillStyle(0xeaeaf6, 1);
//     g2.fillRect(0, 0, 740, 20);
//     g2.generateTexture("groundTex", 740, 20);
//     g2.destroy();

//     // draggable block
//     this.block = this.physics.add
//       .sprite(250, 120, "blockTex")
//       .setDisplaySize(this.blockSize, this.blockSize)
//       .setBounce(0.1)
//       .setDrag(60, 60)
//       .setCollideWorldBounds(true);

//     // ground
//     this.ground = this.physics.add.staticImage(W / 2, H - 60, "groundTex").setDisplaySize(740, 20).refreshBody();
//     this.physics.add.collider(this.block, this.ground);

//     // info
//     this.info = this.label(520, 70, "");
//     this.hint = this.label(520, 95, "Drag block into water. Press ←/→ to change density.");

//     // drag handling
//     this.input.setDraggable(this.block);
//     this.input.on("drag", (p, obj, dragX, dragY) => {
//       obj.x = dragX;
//       obj.y = dragY;
//       obj.body.setVelocity(0, 0);
//     });

//     this.input.keyboard.on("keydown-LEFT", () => this.setDensity(this.blockDensity - 0.05));
//     this.input.keyboard.on("keydown-RIGHT", () => this.setDensity(this.blockDensity + 0.05));

//     this.setDensity(this.blockDensity);
//   }

//   setDensity(val) {
//     this.blockDensity = Phaser.Math.Clamp(Math.round(val * 100) / 100, 0.2, 2.0);
//   }

//   update(time, delta) {
//     const dt = delta / 1000;

//     const blockBottom = this.block.y + this.block.displayHeight / 2;
//     const submerged = blockBottom > this.waterY;

//     if (submerged) {
//       const depth = Phaser.Math.Clamp((blockBottom - this.waterY) / this.block.displayHeight, 0, 1);
//       const buoy = (this.waterDensity - this.blockDensity) * 500 * depth; // tuned
//       this.block.body.velocity.y -= buoy * dt;

//       // damping in water
//       this.block.body.velocity.x *= 0.985;
//       this.block.body.velocity.y *= 0.985;
//     }

//     const state = this.blockDensity < this.waterDensity ? "Float ✅" : "Sink ⬇️";
//     this.info.setText(
//       `Water density: ${this.waterDensity.toFixed(2)}\n` +
//       `Block density: ${this.blockDensity.toFixed(2)}\n` +
//       `Prediction: ${state}`
//     );

//     this.emitMeasurement({
//       density: this.blockDensity.toFixed(2),
//       waterDensity: this.waterDensity.toFixed(2),
//       y: Math.round(this.block.y),
//       state
//     });
//   }
// }
