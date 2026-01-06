import { useEffect, useRef, useState } from "react";
import AnimationControls from "../components/AnimationControls";
import { AnimationEngine } from "../utils/animationEngine";
import { testPhotosynthesisScript } from "../utils/test/testPhotosynthesisScript";
import { testGravityScript } from "../utils/test/testGravityScript";
import { testWaterCycleScript } from "../utils/test/testWaterCycleScript";
import { testElectricityScript } from "../utils/test/testElectricityScript";
import { testRockCycleScript } from "../utils/test/testRockCycleScript";

const testScripts = {
  photosynthesis: {
    name: "Photosynthesis",
    script: testPhotosynthesisScript,
  },
  gravity: {
    name: "Gravity",
    script: testGravityScript,
  },
  waterCycle: {
    name: "Water Cycle",
    script: testWaterCycleScript,
  },
  electricity: {
    name: "Electricity",
    script: testElectricityScript,
  },
  rockCycle: {
    name: "Rock Cycle",
    script: testRockCycleScript,
  },
};

export default function TestPage() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedScript, setSelectedScript] = useState("photosynthesis");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the selected script
    const currentScript = testScripts[selectedScript].script;

    // Create animation engine with selected test script
    const engine = new AnimationEngine(canvas, currentScript);
    engineRef.current = engine;

    // Auto-play
    engine.play();
    setIsPlaying(true);

    // Cleanup
    return () => {
      engine.pause();
    };
  }, [selectedScript]);

  const handlePlay = () => {
    if (engineRef.current) {
      engineRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      engineRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (engineRef.current) {
      engineRef.current.setSpeed(newSpeed);
    }
  };

  const currentScript = testScripts[selectedScript].script;

  return (
    <div className="app-container">
      <div className="left-panel">
        <h1>Test Animations</h1>
        <p
          style={{
            fontSize: "14px",
            color: "#656d76",
            marginTop: "-10px",
            marginBottom: "20px",
          }}
        >
          Testing the animation engine with different test scripts
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="script-select"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#24292f",
            }}
          >
            Select Test Script:
          </label>
          <select
            id="script-select"
            value={selectedScript}
            onChange={(e) => {
              setSelectedScript(e.target.value);
              setIsPlaying(false);
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #d1d9e0",
              borderRadius: "6px",
              background: "#ffffff",
              color: "#24292f",
              cursor: "pointer",
            }}
          >
            {Object.entries(testScripts).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            padding: "20px",
            background: "#f6f8fa",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Animation Details</h3>
          <p>
            <strong>Title:</strong> {currentScript.title}
          </p>
          <p>
            <strong>Duration:</strong> {currentScript.duration / 1000}s
          </p>
          <p>
            <strong>Scenes:</strong> {currentScript.scenes.length}
          </p>
        </div>
      </div>

      <div className="right-panel">
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              flex: 1,
              minHeight: "400px",
              border: "1px solid #d1d9e0",
              borderRadius: "12px",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          />
          <AnimationControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            speed={speed}
            onSpeedChange={handleSpeedChange}
          />
        </div>
      </div>
    </div>
  );
}
