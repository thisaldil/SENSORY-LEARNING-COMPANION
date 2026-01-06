const Animation = require("../models/Animation");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const PY_SERVICE = "http://127.0.0.1:8000";

exports.getAnimation = async (req, res) => {
  const { concept } = req.body;
  const key = concept.trim().toLowerCase();

  // 1️⃣ MongoDB
  const cached = await Animation.findOne({ concept: key });
  if (cached) {
    return res.json({ scenes: cached.scenes, source: "mongodb" });
  }

  // 2️⃣ Prebuilt
  const filePath = path.join(__dirname, "..", "prebuilt", `${key}.json`);
  if (fs.existsSync(filePath)) {
    const scenes = JSON.parse(fs.readFileSync(filePath));
    await Animation.create({ concept: key, scenes, source: "prebuilt" });
    return res.json({ scenes, source: "prebuilt" });
  }

  // 3️⃣ Python AI
  const response = await axios.post(`${PY_SERVICE}/generate-scenes`, { concept });
  const scenes = response.data.scenes;

  await Animation.create({ concept: key, scenes, source: "generated" });

  res.json({ scenes, source: "generated" });
};
