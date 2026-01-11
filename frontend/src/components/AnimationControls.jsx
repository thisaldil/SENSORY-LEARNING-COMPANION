export default function AnimationControls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  speed,
  onSpeedChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white border rounded-xl shadow-sm">
      {/* Play / Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        className={`px-4 py-2 rounded-lg text-white font-semibold transition
          ${isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border font-semibold"
      >
        ↻ Reset
      </button>

      {/* Speed */}
      <div className="flex items-center gap-3 ml-4">
        <span className="text-sm text-gray-600">Speed</span>
        <input
          type="range"
          min="0.25"
          max="3"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-32"
        />
        <span className="text-sm font-medium">{speed}x</span>
      </div>
    </div>
  );
}
