// import Phaser from "phaser";
// import BaseLabScene from "./BaseLabScene.js";

// export default class ElectricityScene extends BaseLabScene {
//   constructor(opts) {
//     super("ElectricityScene", opts);
//     this.voltage = opts.labConfig?.voltage ?? 3.0;
//     this.resistance = opts.labConfig?.resistanceOhms ?? 10;
//     this.connections = new Set();
//     this.selectedNode = null;
//   }

//   create() {
//     this.label(30, 20, "Click two nodes to connect/remove a wire. Press ↑/↓ to change resistance.");

//     this.nodes = {
//       Bm: { x: 150, y: 280, label: "Battery -" },
//       Bp: { x: 150, y: 140, label: "Battery +" },
//       R1: { x: 330, y: 140, label: "Resistor" },
//       R2: { x: 330, y: 280, label: "Resistor" },
//       L1: { x: 510, y: 140, label: "Bulb" },
//       L2: { x: 510, y: 280, label: "Bulb" }
//     };

//     this.requiredEdges = [
//       ["Bp", "R1"],
//       ["R1", "L1"],
//       ["L1", "L2"],
//       ["L2", "R2"],
//       ["R2", "Bm"]
//     ];

//     this.drawStaticParts();
//     this.wireGraphics = this.add.graphics();

//     this.info = this.label(650, 90, "");
//     this.bulb = this.add.circle(650, 210, 32, 0xdddddd);

//     Object.entries(this.nodes).forEach(([id, n]) => {
//       const dot = this.add.circle(n.x, n.y, 10, 0x3a63ff).setInteractive({ useHandCursor: true });
//       this.add.text(n.x - 30, n.y - 32, id, { fontSize: "12px", color: "#333" });

//       dot.on("pointerdown", () => this.onNodeClick(id));
//     });

//     this.input.keyboard.on("keydown-UP", () => this.setResistance(this.resistance + 1));
//     this.input.keyboard.on("keydown-DOWN", () => this.setResistance(this.resistance - 1));
//   }

//   drawStaticParts() {
//     const g = this.add.graphics();
//     g.lineStyle(4, 0x9999aa, 0.6);

//     g.strokeRoundedRect(80, 170, 120, 80, 12);
//     this.add.text(96, 198, "BATTERY", { fontSize: "12px", color: "#333" });

//     g.strokeRoundedRect(280, 170, 120, 80, 12);
//     this.add.text(296, 198, "RESISTOR", { fontSize: "12px", color: "#333" });

//     g.strokeRoundedRect(460, 170, 120, 80, 12);
//     this.add.text(492, 198, "BULB", { fontSize: "12px", color: "#333" });

//     g.destroy();
//   }

//   setResistance(val) {
//     this.resistance = Phaser.Math.Clamp(Math.round(val), 1, 50);
//   }

//   edgeKey(a, b) {
//     return [a, b].sort().join("-");
//   }

//   onNodeClick(id) {
//     if (!this.selectedNode) {
//       this.selectedNode = id;
//       return;
//     }
//     if (this.selectedNode === id) {
//       this.selectedNode = null;
//       return;
//     }

//     const key = this.edgeKey(this.selectedNode, id);
//     if (this.connections.has(key)) this.connections.delete(key);
//     else this.connections.add(key);

//     this.selectedNode = null;
//     this.redrawWires();
//   }

//   redrawWires() {
//     this.wireGraphics.clear();
//     this.wireGraphics.lineStyle(6, 0x3a63ff, 0.65);

//     for (const key of this.connections) {
//       const [a, b] = key.split("-");
//       const A = this.nodes[a];
//       const B = this.nodes[b];
//       if (!A || !B) continue;
//       this.wireGraphics.strokeLineShape(new Phaser.Geom.Line(A.x, A.y, B.x, B.y));
//     }
//   }

//   isCircuitClosed() {
//     return this.requiredEdges.every(([a, b]) => this.connections.has(this.edgeKey(a, b)));
//   }

//   update() {
//     const closed = this.isCircuitClosed();
//     const I = closed ? (this.voltage / this.resistance) : 0;
//     const brightness = Phaser.Math.Clamp(I / 0.3, 0, 1);

//     const base = 0xdddddd;
//     const glow = Phaser.Display.Color.GetColor(
//       220 + Math.round(35 * brightness),
//       220 + Math.round(25 * brightness),
//       220 - Math.round(120 * brightness)
//     );
//     this.bulb.setFillStyle(closed ? glow : base);

//     this.info.setText(
//       `Circuit: ${closed ? "Closed ✅" : "Open ❌"}\n` +
//       `Voltage: ${this.voltage.toFixed(1)} V\n` +
//       `Resistance: ${this.resistance} Ω\n` +
//       `Current: ${I.toFixed(2)} A\n` +
//       `Brightness: ${(brightness * 100).toFixed(0)}%`
//     );

//     this.emitMeasurement({
//       circuit: closed ? "closed" : "open",
//       V: this.voltage.toFixed(1),
//       R: this.resistance,
//       I: I.toFixed(2),
//       brightness: `${Math.round(brightness * 100)}%`
//     });
//   }
// }
