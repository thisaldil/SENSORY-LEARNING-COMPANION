import mongoose from "mongoose";

const LabActivitySchema = new mongoose.Schema(
  {
    grade: { type: Number, required: true, index: true },
    chapter: { type: String, required: true },
    title: { type: String, required: true },

    labKey: {
      type: String,
      required: true,
      enum: [
        "L1_LIVING_SORT",
        "L2_AIR_HAS_MASS",
        "L3_SALINITY_MASS",
        "L4_WIND_TURBINE",
        "L5_LIGHT_TRANSMISSION",
        "L6_SOUND_VIBRATION",
        "L7_MAGNET_STRENGTH",
        "L8_SIMPLE_CIRCUIT",
        "L9_SOLAR_HEATING",
        "L10_FOOD_WEB",
        "L11_RAIN_GAUGE"
      ]
    },

    objective: { type: String, required: true },
    materials: [{ type: String, required: true }],

    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("LabActivity", LabActivitySchema);