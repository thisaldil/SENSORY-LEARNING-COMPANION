import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function AnimationCanvas({ script }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!script) return;

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    try {
      const wrappedScript = `
        ${script}
        return dynamicAnimation(containerId);
      `;

      const func = new Function(
        "THREE",
        "OrbitControls",
        "containerId",
        wrappedScript
      );

      func(THREE, OrbitControls, "animation-container");

    } catch (err) {
      console.error("Animation execution error:", err);
    }

  }, [script]);

  return (
    <div
      id="animation-container"
      ref={containerRef}
      className="w-full h-full bg-gray-200 rounded shadow-inner"
    >
      {!script && <p className="text-gray-500 p-4">Enter a concept</p>}
    </div>
  );
}