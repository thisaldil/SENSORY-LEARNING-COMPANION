const Animation = require('../models/Animation');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PY_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

exports.getAnimation = async (req, res) => {
  const { concept } = req.body;
  if (!concept || typeof concept !== 'string') {
    return res.status(400).json({ error: 'concept (string) is required' });
  }

  const key = concept.trim().toLowerCase();

  try {
    // ===== 1) Check prebuilt animation =====
    const prebuiltPath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'src',
      'threejs',
      'prebuilt',
      `${formatFileName(key)}.js`
    );

    if (fs.existsSync(prebuiltPath)) {
      const script = fs.readFileSync(prebuiltPath, 'utf-8');

      // Save to MongoDB if not exists
      let existing = await Animation.findOne({ concept: key });
      if (!existing) {
        const newAnim = new Animation({ concept: key, script, source: 'prebuilt' });
        await newAnim.save();
      }

      return res.json({ script, source: 'prebuilt' });
    }

    // ===== 2) Check MongoDB =====
    const anim = await Animation.findOne({ concept: key });
    if (anim) {
      return res.json({ script: anim.script, source: anim.source });
    }

    // ===== 3) Generate new animation via Python service =====
    const response = await axios.post(
      `${PY_SERVICE}/generate`,
      { concept: key },
      { timeout: 30000 }
    );

    if (!response.data || !response.data.script) {
      return res.status(500).json({ error: 'Python service failed to generate' });
    }

    const script = response.data.script;

    // Save generated animation to DB
    const stored = new Animation({ concept: key, script, source: 'generated' });
    await stored.save();

    res.json({ script, source: 'generated' });

  } catch (err) {
    console.error('getAnimation error:', err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
};

// sanitize filenames
function formatFileName(concept) {
  return concept.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
}
