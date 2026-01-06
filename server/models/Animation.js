const mongoose = require("mongoose");

const AnimationSchema = new mongoose.Schema({
  concept: { type: String, unique: true },
  scenes: { type: Array, required: true },
  source: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Animation", AnimationSchema);
