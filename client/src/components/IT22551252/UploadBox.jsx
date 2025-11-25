import React, { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloudIcon } from "lucide-react";

export function UploadBox({ onFileSelect, onTextInput }) {
  const [isDragging, setIsDragging] = useState(false);
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'text'

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleTextSubmit = () => {
    if (text.trim()) {
      onTextInput(text);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex mb-4 border-b">
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 ${
            activeTab === "upload"
              ? "border-b-2 border-[#1E7038] text-[#1E7038]"
              : "text-gray-500"
          }`}
        >
          Upload Image
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`px-4 py-2 ${
            activeTab === "text"
              ? "border-b-2 border-[#1E7038] text-[#1E7038]"
              : "text-gray-500"
          }`}
        >
          Enter Text
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" ? (
        <motion.div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center ${
            isDragging ? "border-[#1E7038] bg-green-50" : "border-gray-300"
          } transition-colors duration-200 cursor-pointer`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload")?.click()}
          whileHover={{
            scale: 1.01,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
          }}
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <UploadCloudIcon size={48} className="text-gray-400 mb-4" />
          <p className="text-gray-600 text-center mb-2">
            Drag and drop an image here, or click to select a file
          </p>
          <p className="text-gray-400 text-sm text-center">
            Supported formats: JPG, PNG, PDF
          </p>
        </motion.div>
      ) : (
        // Text Input Tab
        <div className="border rounded-lg p-4">
          <textarea
            className="w-full h-40 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E7038] resize-none"
            placeholder="Enter textbook paragraph or content here..."
            value={text}
            onChange={handleTextChange}
          />
          <motion.button
            className="mt-4 px-4 py-2 bg-[#1E7038] text-white rounded-md hover:bg-[#16542B] transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTextSubmit}
          >
            Process Text
          </motion.button>
        </div>
      )}
    </div>
  );
}
