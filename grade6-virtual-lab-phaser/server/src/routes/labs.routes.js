import express from "express";
import LabActivity from "../models/LabActivity.js";

const router = express.Router();

// GET /api/labs?grade=6
router.get("/", async (req, res) => {
  try {
    const grade = Number(req.query.grade ?? 6);
    const labs = await LabActivity.find({ grade, isPublished: true }).sort({ chapter: 1, title: 1 });
    res.json(labs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch labs" });
  }
});

// GET /api/labs/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid lab id" });
    }

    const lab = await LabActivity.findById(id);
    if (!lab) return res.status(404).json({ message: "Lab not found" });
    res.json(lab);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch lab" });
  }
});

export default router;
