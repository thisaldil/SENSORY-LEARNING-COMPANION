const axios = require("axios");

const PY_SERVICE = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

exports.getAnimation = async (req, res) => {
  const { concept } = req.body;

  if (!concept || typeof concept !== "string") {
    return res.status(400).json({ error: "concept (string) is required" });
  }

  try {
    const response = await axios.post(
      `${PY_SERVICE}/generate`,
      { concept: concept.trim() },
      { timeout: 30000 }
    );

    if (!response.data || !response.data.scene) {
      return res.status(500).json({ error: "Python service failed to generate scene" });
    }

    // Return scene JSON to frontend
    res.json({
      concept: response.data.concept,
      sceneId: response.data.sceneId,
      scene: response.data.scene,
      source: "scene-json"
    });
  } catch (err) {
    console.error("getAnimation error:", err.message || err);
    res.status(500).json({ error: "Server error" });
  }
};