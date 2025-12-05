
const router = express.Router();
import express from "express";
import axios from "axios";
import multer from "multer";
const upload = multer();


const PYTHON_URL = "http://127.0.0.1:7000";

// PROCESS TEXT
router.post("/process-text", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await axios.post(`${PYTHON_URL}/process-text`, {
      text: text || ""
    });

    return res.json(response.data);
  } catch (err) {
    console.error("NLP Text Error:", err.message);
    return res.status(500).json({ error: "NLP service unavailable" });
  }
});

router.post("/process-image", upload.single("file"), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);

    const response = await axios.post(`${PYTHON_URL}/process-image`, formData, {
      headers: formData.getHeaders()
    });

    return res.json(response.data);
  } catch (err) {
    console.error("NLP Image Error:", err.message);
    return res.status(500).json({ error: "NLP service unavailable" });
  }
});
export default router;
