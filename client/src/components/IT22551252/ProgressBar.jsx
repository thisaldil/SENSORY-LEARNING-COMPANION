import React from "react";
import { motion } from "framer-motion";

export function ProgressBar({ progress, status }) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{status}</span>
        <span className="text-sm font-medium text-gray-700">{progress}%</span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#1E7038]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
