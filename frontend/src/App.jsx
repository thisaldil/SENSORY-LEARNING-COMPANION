import { useState } from "react";
import ConceptForm from "./components/ConceptForm";
import AnimationCanvas from "./components/AnimationCanvas";
import "./index.css";

export default function App() {
  const [scene, setScene] = useState(null);

  return (
    <div className="h-screen grid grid-cols-[35%_65%]">
      <ConceptForm onSceneLoaded={setScene} />
      <div className="bg-gray-100 p-6">
        <AnimationCanvas scene={scene} />
      </div>
    </div>
  );
}