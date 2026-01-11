import { useEffect, useRef } from "react";

export default function AnimationCanvas({ script }) {
  const containerRef = useRef();

  useEffect(() => {
    if (!script) return;

    // Remove previous animation
    containerRef.current.innerHTML = "";

    // Dynamically create and execute JS
    const func = new Function("containerId", script + "\nreturn dynamicAnimation(containerId);");
    func(containerRef.current.id);
  }, [script]);

  return (
    <div
      id="animation-container"
      ref={containerRef}
      className="w-full h-full bg-gray-200 rounded shadow-inner flex items-center justify-center"
    >
      {!script && <p className="text-gray-500">Enter a concept to see animation</p>}
    </div>
  );
}
