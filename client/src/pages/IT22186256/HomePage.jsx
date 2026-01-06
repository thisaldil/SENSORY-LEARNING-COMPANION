import { useState } from "react";
import ConceptForm from "../components/ConceptForm";
import AnimationCanvas from "../components/AnimationCanvas";
import ExplanationPanel from "../components/ExplanationPanel";

export default function HomePage() {
  const [animationData, setAnimationData] = useState(null);

  return (
    <div className="app-container">
      {/* LEFT SIDE PANEL */}
      <div className="left-panel">
        <h1>Visual Learning Platform</h1>
        <p
          style={{
            fontSize: "14px",
            color: "#656d76",
            marginTop: "-10px",
            marginBottom: "20px",
          }}
        >
          Transform concepts into interactive cartoon-style animations
        </p>
        <ConceptForm onScriptLoaded={setAnimationData} />
        {animationData && (
          <ExplanationPanel
            concept={animationData.conceptText}
            script={animationData.script}
          />
        )}
      </div>

      {/* RIGHT SIDE VIEWER */}
      <div className="right-panel">
        <AnimationCanvas script={animationData?.script} />
      </div>
    </div>
  );
}

