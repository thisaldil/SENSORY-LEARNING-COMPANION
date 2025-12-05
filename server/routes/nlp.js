const express = require("express");
const router = express.Router();
const axios = require("axios");

// FOR NOW: Python service URL
const PYTHON_URL = "http://127.0.0.1:7000";

router.post("/process-text", async (req, res) => {
    // forward the request to FastAPI
});

router.post("/process-image", async (req, res) => {
    // forward multipart file to FastAPI
});

module.exports = router;
