import mongoose from "mongoose";

const LabResultSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: "LabActivity", required: true, index: true },

    // recorded measurements rows (table) + last state snapshot
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    score: { type: Number, default: 0 },
    isComplete: { type: Boolean, default: false },
    attempts: { type: Number, default: 1 }
  },
  { timestamps: true }
);

LabResultSchema.index({ studentId: 1, labId: 1 }, { unique: true });

export default mongoose.model("LabResult", LabResultSchema);
