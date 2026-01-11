import { useState } from "react";
import ConceptForm from "./components/ConceptForm";
import AnimationCanvas from "./components/AnimationCanvas";
import "./index.css";

export default function App() {
  const [script, setScript] = useState(null);

  return (
    <div className="h-screen grid grid-cols-[35%_65%]">
      {/* LEFT */}
      <ConceptForm onScriptLoaded={setScript} />

      {/* RIGHT */}
      <div className="bg-gray-100 p-6">
        <AnimationCanvas script={script} />
      </div>
    </div>
  );
}
