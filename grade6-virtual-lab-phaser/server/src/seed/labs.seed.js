import dotenv from "dotenv";
import mongoose from "mongoose";
import LabActivity from "../models/LabActivity.js";

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/grade6_virtual_lab_phaser";
  await mongoose.connect(uri);
  console.log("✅ Connected for seeding (", uri, ")");

  await LabActivity.deleteMany({ grade: 6 });

  await LabActivity.insertMany([
    {
      grade: 6,
      chapter: "1. Wonders of the Living World",
      title: "Living vs Non-Living (Observation Sort)",
      labKey: "L1_LIVING_SORT",
      objective: "Observe and sort items into Living and Non-living.",
      materials: ["Item cards", "Living box", "Non-living box"],
      config: {
        items: [
          { name: "Tree", answer: "living" },
          { name: "Dog", answer: "living" },
          { name: "Butterfly", answer: "living" },
          { name: "Rock", answer: "nonliving" },
          { name: "Book", answer: "nonliving" },
          { name: "Car", answer: "nonliving" }
        ]
      },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "2. Things Around Us",
      title: "Does Air Have Mass? (Balloon Balance)",
      labKey: "L2_AIR_HAS_MASS",
      objective: "Inflate balloons and observe balance tilt to learn air has mass.",
      materials: ["Two balloons", "Balance bar", "Air control keys (Q/A, O/L)"],
      config: { baseMass: 50, airMassPerUnit: 0.8, startLeftAir: 30, startRightAir: 30 },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "3. Water as a Natural Resource",
      title: "Salinity vs Mass (Same Volume Test)",
      labKey: "L3_SALINITY_MASS",
      objective: "Add salt to water and observe mass increase.",
      materials: ["3 beakers (25 ml)", "Salt control (↑/↓)", "Select beaker (1/2/3)", "Digital scale"],
      config: { volumeMl: 25, baseMass: 25, saltFactor: 1.0, maxSalt: 10 },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "4. Energy in Day to Day Life",
      title: "Wind Energy (Turbine Lifts a Weight)",
      labKey: "L4_WIND_TURBINE",
      objective: "Change wind strength and see turbine lift a load.",
      materials: ["Wind control (←/→)", "Turbine", "Hanging weight"],
      config: { maxWind: 10, liftFactor: 0.08 },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "5. Light and Vision",
      title: "Light Transmission (Transparent/Translucent/Opaque)",
      labKey: "L5_LIGHT_TRANSMISSION",
      objective: "Test materials and measure how much light passes through.",
      materials: ["Torch", "Material buttons", "Light sensor"],
      config: {
        materials: [
          { name: "Clear Glass", transmission: 0.9 },
          { name: "Oiled Paper", transmission: 0.4 },
          { name: "Cardboard", transmission: 0.0 }
        ]
      },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "6. Sound and Hearing",
      title: "Sound is Vibration (Drum/Bell/String)",
      labKey: "L6_SOUND_VIBRATION",
      objective: "Create sound and observe vibration strength.",
      materials: ["Drum button", "Bell button", "String button", "Vibration meter"],
      config: { maxAmplitude: 100 },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "7. Magnets",
      title: "Where is a Magnet Strongest? (Poles Test)",
      labKey: "L7_MAGNET_STRENGTH",
      objective: "Compare magnet strength at poles vs the middle.",
      materials: ["Bar magnet (drag)", "Paper clips", "Strength meter"],
      config: { poleStrength: 1.0, midStrength: 0.35, maxClips: 20 },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "8. Electricity for a Comfortable Life",
      title: "Simple Circuit Builder (Bulb On/Off)",
      labKey: "L8_SIMPLE_CIRCUIT",
      objective: "Make a closed circuit to light the bulb. Use switch to open/close.",
      materials: ["Battery", "Bulb", "Wire nodes (click)", "Switch (S)", "Resistance (↑/↓)"],
      config: { voltage: 3.0, resistanceOhms: 10 },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "9. Heat and Its Effects",
      title: "Solar Heating (Water Temperature Rise)",
      labKey: "L9_SOLAR_HEATING",
      objective: "Change sunlight and observe water temperature increase.",
      materials: ["Sunlight (←/→)", "Thermometer readings"],
      config: { startTemp: 28, sun: 50, heatRate: 0.06 },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "10. Food Related Interactions",
      title: "Build a Food Web (Connect Arrows)",
      labKey: "L10_FOOD_WEB",
      objective: "Connect who eats what and build a food web.",
      materials: ["Organism nodes (click from→to)", "Check accuracy"],
      config: {
        nodes: ["Guava", "Parrot", "Squirrel", "Caterpillar", "Lizard", "Snake", "Eagle"],
        links: [
          ["Guava", "Parrot"],
          ["Guava", "Squirrel"],
          ["Guava", "Caterpillar"],
          ["Caterpillar", "Lizard"],
          ["Lizard", "Snake"],
          ["Snake", "Eagle"]
        ]
      },
      isPublished: true
    },

    {
      grade: 6,
      chapter: "11. Weather and Climate",
      title: "Rain Gauge (Measure Rainfall)",
      labKey: "L11_RAIN_GAUGE",
      objective: "Simulate rain and measure rainfall in millimeters.",
      materials: ["Rain rate (←/→)", "Rain gauge", "Scale marks"],
      config: { maxRainRate: 10, fillFactor: 0.25 },
      isPublished: true
    }
  ]);

  console.log("✅ Seeded 11 labs");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});