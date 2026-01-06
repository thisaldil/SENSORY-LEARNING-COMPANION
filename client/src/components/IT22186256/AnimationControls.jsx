import { useState } from "react";

export default function AnimationControls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  speed,
  onSpeedChange,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        padding: "10px",
        background: "#ffffff",
        borderRadius: "8px",
        marginTop: "10px",
        flexWrap: "wrap",
        border: "1px solid #d1d9e0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Play/Pause Button */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        style={{
          padding: "8px 16px",
          border: "none",
          borderRadius: "6px",
          background: isPlaying ? "#da3633" : "#0969da",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "14px",
          transition: "background 0.2s",
        }}
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>

      {/* Reset Button */}
      <button
        onClick={onReset}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          background: "#f6f8fa",
          color: "#1f2328",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "14px",
          border: "1px solid #d1d9e0",
          transition: "background 0.2s",
        }}
      >
        ↻ Reset
      </button>

      {/* Speed Control */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginLeft: "10px",
        }}
      >
        <label style={{ fontSize: "14px", color: "#656d76" }}>Speed:</label>
        <input
          type="range"
          min="0.25"
          max="3"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          style={{ width: "120px" }}
        />
        <span style={{ fontSize: "14px", color: "#1f2328", minWidth: "40px" }}>
          {speed}x
        </span>
      </div>
    </div>
  );
}
