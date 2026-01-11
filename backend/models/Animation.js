const mongoose = require('mongoose');

const AnimationSchema = new mongoose.Schema({
  concept: { type: String, required: true, unique: true },
  script: { type: String, required: true }, // JS code string
  source: { type: String, required: true }, // 'prebuilt'|'generated'|'python'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Animation', AnimationSchema);
