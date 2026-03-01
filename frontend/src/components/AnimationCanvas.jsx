import { useEffect, useRef, useState } from "react";
import { createScenePlayer } from "../three/renderer";
import Controls from "./AnimationControls";

export default function AnimationCanvas({ scene }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!scene) return;
    const container = containerRef.current;
    if (!container) return;

    // cleanup old
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // create new
    const player = createScenePlayer(container, scene);
    player.setSpeed(speed);
    if (!isPlaying) player.pause();

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [scene]);

  const onPlay = () => {
    setIsPlaying(true);
    playerRef.current?.play();
  };

  const onPause = () => {
    setIsPlaying(false);
    playerRef.current?.pause();
  };

  const onReset = () => {
    // simplest reset: re-mount scene by forcing rebuild from parent (optional)
    // Here: just destroy + recreate quickly if needed; for now you can keep it.
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = createScenePlayer(containerRef.current, scene);
      playerRef.current.setSpeed(speed);
      if (!isPlaying) playerRef.current.pause();
    }
  };

  const onSpeedChange = (v) => {
    setSpeed(v);
    playerRef.current?.setSpeed(v);
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <Controls
        isPlaying={isPlaying}
        onPlay={onPlay}
        onPause={onPause}
        onReset={onReset}
        speed={speed}
        onSpeedChange={onSpeedChange}
      />
      <div
        ref={containerRef}
        className="flex-1 w-full bg-gray-200 rounded-xl shadow-inner overflow-hidden"
      >
        {!scene && <p className="text-gray-500 p-4">Enter a concept</p>}
      </div>
    </div>
  );
}