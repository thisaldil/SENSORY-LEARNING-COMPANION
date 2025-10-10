import React, { useState } from "react";
import { PlayIcon, PauseIcon, DownloadIcon } from "lucide-react";
import { motion } from "framer-motion";

export function NarrationScript({
  script,
  highlightedSentence,
  onSentenceHover,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const sentences = script.split(/(?<=[.!?])\s+/);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const downloadScript = () => {
    const element = document.createElement("a");
    const file = new Blob([script], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "narration-script.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-full flex flex-col border rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 p-3 border-b">
        <h3 className="font-medium text-gray-800">Narration Script</h3>
        <div className="flex space-x-2">
          <motion.button
            className="p-2 rounded-full hover:bg-gray-200 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayback}
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </motion.button>
          <motion.button
            className="p-2 rounded-full hover:bg-gray-200 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={downloadScript}
          >
            <DownloadIcon size={20} />
          </motion.button>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto text-gray-700 leading-relaxed">
        {sentences.map((sentence, index) => (
          <span
            key={index}
            className={`inline ${
              highlightedSentence === index ? "bg-blue-100" : ""
            }`}
            onMouseEnter={() => onSentenceHover && onSentenceHover(index)}
            onMouseLeave={() => onSentenceHover && onSentenceHover(null)}
          >
            {sentence + " "}
          </span>
        ))}
      </div>
    </div>
  );
}
