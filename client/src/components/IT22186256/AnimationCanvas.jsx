import { useEffect, useRef, useState } from "react";
import AnimationControls from "./AnimationControls";
import { AnimationEngine } from "../utils/animationEngine";

export default function AnimationCanvas({ script }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentScene, setCurrentScene] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedScript, setParsedScript] = useState(null);

  // Reset state when script changes
  useEffect(() => {
    setIsPlaying(false);
    setSpeed(1);
    setCurrentTime(0);
    setCurrentScene(null);
    setError(null);
    setParsedScript(null);
  }, [script]);

  useEffect(() => {
    if (!script) {
      setError(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setError(null);

    // Parse script (handle both JSON string and object)
    let animationScript;
    try {
      if (typeof script === "string") {
        animationScript = JSON.parse(script);
      } else if (typeof script === "object") {
        animationScript = script;
      } else {
        throw new Error("Invalid script format");
      }
    } catch (e) {
      console.error("Error parsing script:", e);
      setError("Failed to parse animation script. Please check the format.");
      setIsLoading(false);
      return;
    }

    // Validate script structure
    if (!animationScript.scenes || !Array.isArray(animationScript.scenes)) {
      setError("Invalid script: missing scenes array");
      setIsLoading(false);
      return;
    }

    // Create animation engine
    try {
      const engine = new AnimationEngine(canvas, animationScript);
      engineRef.current = engine;
      setParsedScript(animationScript);

      // Update current scene periodically
      const updateInterval = setInterval(() => {
        if (engine && engine.currentTime !== undefined) {
          setCurrentTime(engine.currentTime);

          // Find current scene
          const scene = animationScript.scenes.find(
            (s) =>
              engine.currentTime >= s.startTime &&
              engine.currentTime < s.startTime + s.duration
          );
          setCurrentScene(scene || null);
        }
      }, 100);

      // Auto-play
      engine.play();
      setIsPlaying(true);
      setIsLoading(false);

      // Cleanup
      return () => {
        clearInterval(updateInterval);
        engine.pause();
      };
    } catch (e) {
      console.error("Error creating animation engine:", e);
      setError("Failed to initialize animation. Please try again.");
      setIsLoading(false);
    }
  }, [script]);

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
      setCurrentTime(0);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (engineRef.current) {
      engineRef.current.setSpeed(newSpeed);
    }
  };

  // Calculate progress percentage
  const progress = parsedScript
    ? Math.min(100, (currentTime / parsedScript.duration) * 100)
    : 0;

  // Format time
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header Card */}
      {parsedScript && (
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "16px",
            padding: "20px 24px",
            color: "white",
            boxShadow: "0 4px 20px rgba(102, 126, 234, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "600",
                  marginBottom: "4px",
                }}
              >
                {parsedScript.title || "Animation"}
              </h2>
              {currentScene && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    opacity: 0.9,
                    fontWeight: "400",
                  }}
                >
                  {currentScene.text}
                </p>
              )}
            </div>
            <div
              style={{
                textAlign: "right",
                fontSize: "14px",
                opacity: 0.9,
              }}
            >
              <div style={{ marginBottom: "4px" }}>
                Scene{" "}
                {parsedScript.scenes.findIndex((s) => s === currentScene) + 1 ||
                  0}{" "}
                / {parsedScript.scenes.length}
              </div>
              <div>
                {formatTime(currentTime)} / {formatTime(parsedScript.duration)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "3px",
              overflow: "hidden",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)",
                borderRadius: "3px",
                transition: "width 0.1s ease-out",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
              }}
            />
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
          border: "1px solid #e1e8ed",
          minHeight: "400px",
          position: "relative",
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              borderRadius: "16px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid #e1e8ed",
                  borderTop: "4px solid #667eea",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ color: "#656d76", fontSize: "14px", margin: 0 }}>
                Loading animation...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.98)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                maxWidth: "400px",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "16px",
                }}
              >
                ⚠️
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  color: "#da3633",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Animation Error
              </h3>
              <p
                style={{
                  color: "#656d76",
                  fontSize: "14px",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!parsedScript && !error && !isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
            }}
          >
            <div style={{ textAlign: "center", padding: "32px" }}>
              <div
                style={{
                  fontSize: "64px",
                  marginBottom: "16px",
                  opacity: 0.5,
                }}
              >
                🎬
              </div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  color: "#1f2328",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                No Animation Loaded
              </h3>
              <p
                style={{
                  color: "#656d76",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                Enter a concept to generate an animation
              </p>
            </div>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: parsedScript ? "block" : "none",
            background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
          }}
        />
      </div>

      {/* Controls */}
      {parsedScript && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e1e8ed",
          }}
        >
          <AnimationControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            speed={speed}
            onSpeedChange={handleSpeedChange}
          />
        </div>
      )}

      {/* Add CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
