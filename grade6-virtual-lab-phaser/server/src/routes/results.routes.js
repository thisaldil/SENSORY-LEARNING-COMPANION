import express from "express";
import { z } from "zod";
import LabResult from "../models/LabResult.js";
import LabActivity from "../models/LabActivity.js";

const router = express.Router();

// GET /api/results?studentId=...&labId=...
router.get("/", async (req, res) => {
  try {
    const { studentId, labId } = req.query;
    if (!studentId || !labId) return res.status(400).json({ message: "studentId and labId required" });

    if (!labId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid labId" });
    }

    const result = await LabResult.findOne({ studentId, labId });
    res.json(result ?? null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch result" });
  }
});

const upsertSchema = z.object({
  studentId: z.string().min(1),
  labId: z.string().min(1),
  data: z.any().optional(),
  score: z.number().min(0).max(100).optional(),
  isComplete: z.boolean().optional()
});

// POST /api/results/upsert
router.post("/upsert", async (req, res) => {
  try {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

    const { studentId, labId, data, score, isComplete } = parsed.data;

    if (!labId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid labId" });
    }

    const lab = await LabActivity.findById(labId);
    if (!lab) return res.status(404).json({ message: "Lab not found" });

    const existing = await LabResult.findOne({ studentId, labId });

    if (!existing) {
      const created = await LabResult.create({
        studentId,
        labId,
        data: data ?? {},
        score: score ?? 0,
        isComplete: isComplete ?? false,
        attempts: 1
      });
      return res.json(created);
    }

    existing.data = { ...(existing.data ?? {}), ...(data ?? {}) };
    if (typeof score === "number") existing.score = score;
    if (typeof isComplete === "boolean") existing.isComplete = isComplete;
    existing.attempts = (existing.attempts ?? 1) + 1;

    await existing.save();
    res.json(existing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upsert result" });
  }
});

export default router;
