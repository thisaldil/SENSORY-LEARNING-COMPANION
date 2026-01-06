const express = require("express");
const router = express.Router();
const { getAnimation } = require("../controllers/animationController");

router.post("/get-animation", getAnimation);

module.exports = router;
