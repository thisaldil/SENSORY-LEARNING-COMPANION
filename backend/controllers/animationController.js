const axios = require('axios');

const PY_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

exports.getAnimation = async (req, res) => {
  const { concept } = req.body;

  if (!concept || typeof concept !== 'string') {
    return res.status(400).json({ error: 'concept (string) is required' });
  }

  const key = concept.trim().toLowerCase();

  try {
    // ===== 1) Always generate new animation from Python service =====
    const response = await axios.post(
      `${PY_SERVICE}/generate`,
      { concept: key },
      { timeout: 30000 }
    );

    if (!response.data || !response.data.script) {
      return res.status(500).json({ error: 'Python service failed to generate' });
    }

    const script = response.data.script;

    // ⚠️ Do NOT save to MongoDB yet to avoid old cached scripts causing import errors
    res.json({ script, source: 'generated' });

  } catch (err) {
    console.error('getAnimation error:', err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
};