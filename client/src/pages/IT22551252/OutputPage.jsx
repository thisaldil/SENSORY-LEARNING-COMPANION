import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SceneGraph } from "../components/SceneGraph";
import { NarrationScript } from "../components/NarrationScript";
import { DownloadIcon, Share2Icon } from "lucide-react";

export function OutputPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [highlightedSentence, setHighlightedSentence] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (location.state?.result) {
      setData(location.state.result);
    } else {
      // Redirect to input page if no data found
      navigate("/input");
    }
  }, [location.state, navigate]);

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E7038]"></div>
      </div>
    );
  }

  const handleNodeClick = (nodeId) => {
    console.log(`Node clicked: ${nodeId}`);
    // Future: highlight corresponding text or connected nodes
  };

  const handleSentenceHover = (index) => {
    setHighlightedSentence(index);
    // Future: highlight relevant graph nodes
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = "scene-graph-data.json";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Generated Scene & Script</h1>
          <div className="flex space-x-3">
            {/* Download JSON */}
            <motion.button
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadJson}
            >
              <DownloadIcon size={18} className="mr-2" />
              Download JSON
            </motion.button>

            {/* Preview in LMS (Placeholder) */}
            <motion.button
              className="flex items-center px-4 py-2 bg-[#1E7038] hover:bg-[#16542B] text-white rounded-md"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Share2Icon size={18} className="mr-2" />
              Preview in LMS
            </motion.button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scene Graph */}
          <div className="h-[600px]">
            <h2 className="text-xl font-medium mb-3">Scene Graph</h2>
            <SceneGraph
              nodes={data.nodes}
              links={data.links}
              onNodeClick={handleNodeClick}
            />
          </div>

          {/* Narration Script */}
          <div className="h-[600px]">
            <h2 className="text-xl font-medium mb-3">Narration Script</h2>
            <NarrationScript
              script={data.script}
              highlightedSentence={highlightedSentence}
              onSentenceHover={handleSentenceHover}
            />
          </div>
        </div>

        {/* Instructions Section */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-2">How to Use This Output</h3>
          <p className="mb-4">
            This generated scene graph and narration script can be used in
            various educational contexts:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Import into your Learning Management System</li>
            <li>Use as a foundation for interactive learning experiences</li>
            <li>Adapt for visual, audio, or haptic learning modalities</li>
            <li>Integrate with other educational tools</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
