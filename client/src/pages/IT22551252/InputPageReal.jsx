import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  FileAudio,
  FileImage,
  Mic,
  Sparkles,
  Square,
  Trash2,
  Type,
  UploadCloud,
} from "lucide-react";

function InputPageReal() {
  const [activeTab, setActiveTab] = useState("text"); // text | image | audio | mic
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const [isDragging, setIsDragging] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState(null);
  const [micBlob, setMicBlob] = useState(null);
  const [micUrl, setMicUrl] = useState("");

  const mediaRecorderRef = useRef(null);
  const micStreamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (micUrl) URL.revokeObjectURL(micUrl);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
    };
  }, [micUrl]);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (activeTab === "image") setImageFile(file);
    if (activeTab === "audio") setAudioFile(file);
  };

  const startRecording = async () => {
    try {
      setMicError(null);
      setMicBlob(null);
      if (micUrl) {
        URL.revokeObjectURL(micUrl);
        setMicUrl("");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setMicBlob(blob);
        setMicUrl(URL.createObjectURL(blob));

        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((t) => t.stop());
          micStreamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setIsRecording(false);
      setMicError(
        typeof err?.message === "string" && err.message
          ? err.message
          : "Microphone access failed. Please allow mic permission."
      );
    }
  };

  const stopRecording = () => {
    try {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
    } finally {
      setIsRecording(false);
    }
  };

  const clearMicRecording = () => {
    setMicError(null);
    setMicBlob(null);
    if (micUrl) URL.revokeObjectURL(micUrl);
    setMicUrl("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 p-4 sm:p-6">
      {/* Home.jsx-style animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-6 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div
          className="absolute top-28 right-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-10 left-24 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center pt-6 pb-6">
          <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur rounded-full px-4 py-2 border border-white/60 shadow-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-40" />
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-full p-2">
                <Brain className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="font-semibold text-gray-800">
              Educational Scene & Script Generator
            </span>
          </div>

          <h1 className="mt-6 text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Create multi-sensory lessons
            </span>
          </h1>
          <p className="mt-3 text-gray-700 text-lg max-w-2xl mx-auto">
            Add your lesson input as text, image, an audio file, or by recording
            your voice using the microphone.
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur rounded-3xl shadow-2xl border-2 border-white/60 overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex flex-col sm:flex-row gap-2 p-4 sm:p-6 border-b border-white/60">
            <TabButton
              active={activeTab === "text"}
              onClick={() => setActiveTab("text")}
              icon={<Type className="w-5 h-5" />}
              label="Text"
            />
            <TabButton
              active={activeTab === "image"}
              onClick={() => setActiveTab("image")}
              icon={<FileImage className="w-5 h-5" />}
              label="Image"
            />
            <TabButton
              active={activeTab === "audio"}
              onClick={() => setActiveTab("audio")}
              icon={<FileAudio className="w-5 h-5" />}
              label="Audio File"
            />
            <TabButton
              active={activeTab === "mic"}
              onClick={() => setActiveTab("mic")}
              icon={<Mic className="w-5 h-5" />}
              label="Mic"
            />
          </div>

          <div className="p-4 sm:p-6">
            {/* Inputs (tabbed) */}
            {activeTab === "text" && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Text Input
                </label>
                <textarea
                  className="w-full min-h-40 p-4 rounded-2xl border-2 border-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-200 bg-white"
                  placeholder="Paste lesson text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            )}

            {activeTab === "image" && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Image Upload
                </label>

                <motion.div
                  className={`rounded-3xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-colors bg-white ${
                    isDragging
                      ? "border-purple-400 bg-purple-50"
                      : "border-gray-200 hover:border-purple-200"
                  }`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => document.getElementById("slc-image-upload")?.click()}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-700 font-medium">
                    Drag & drop, or click to select an image file
                  </p>
                  <p className="text-gray-500 text-sm mt-1">Supported: JPG, PNG, PDF</p>

                  <input
                    id="slc-image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setImageFile(file);
                    }}
                  />
                </motion.div>

                {imageFile && (
                  <div className="mt-3 text-sm text-gray-700">
                    Selected: <span className="font-semibold">{imageFile.name}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "audio" && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Audio File Upload
                </label>

                <motion.div
                  className={`rounded-3xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-colors bg-white ${
                    isDragging
                      ? "border-purple-400 bg-purple-50"
                      : "border-gray-200 hover:border-purple-200"
                  }`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => document.getElementById("slc-audio-upload")?.click()}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-700 font-medium">
                    Drag & drop, or click to select an audio file
                  </p>
                  <p className="text-gray-500 text-sm mt-1">Supported: WAV, MP3, M4A</p>

                  <input
                    id="slc-audio-upload"
                    type="file"
                    className="hidden"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAudioFile(file);
                    }}
                  />
                </motion.div>

                {audioFile && (
                  <div className="mt-3 text-sm text-gray-700">
                    Selected: <span className="font-semibold">{audioFile.name}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "mic" && (
              <div>
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-5 h-5 text-gray-700" />
                <label className="block text-sm font-semibold text-gray-800">
                  Microphone (Record Voice)
                </label>
              </div>

              {micError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {micError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isRecording}
                  onClick={startRecording}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold shadow transition-all border-2 ${
                    isRecording
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200"
                      : "bg-white text-gray-800 border-gray-200 hover:border-purple-200"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!isRecording}
                  onClick={stopRecording}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold shadow transition-all border-2 ${
                    !isRecording
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200"
                      : "bg-white text-gray-800 border-gray-200 hover:border-purple-200"
                  }`}
                >
                  <Square className="w-5 h-5" />
                  Stop
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!micBlob && !micUrl}
                  onClick={clearMicRecording}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold shadow transition-all border-2 ${
                    !micBlob && !micUrl
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200"
                      : "bg-white text-gray-800 border-gray-200 hover:border-purple-200"
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                  Clear
                </motion.button>
              </div>

              {micUrl && (
                <div className="mt-4 rounded-2xl border-2 border-gray-100 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Preview</div>
                  <audio controls src={micUrl} className="w-full" />
                </div>
              )}
              </div>
            )}

            {/* Action */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                Generate is disabled for now (no output page yet).
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {}}
                className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl font-bold shadow-xl transition-all bg-gray-200 text-gray-500 cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5" />
                Generate
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Info Section (kept, restyled like Home.jsx cards) */}
            <div className="mt-10 rounded-3xl border-2 border-purple-100 bg-white/80 p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-2">How it works</h3>
              <p className="text-gray-700 mb-2">
                Our Educational Scene & Script Generator uses advanced AI to:
              </p>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li>Extract meaningful academic content using OCR and NLP</li>
                <li>Understand relationships between concepts</li>
                <li>Enrich abstract ideas with real-world examples</li>
                <li>Generate structured scene graphs and narration scripts</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold border-2 transition-colors ${
        active
          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent"
          : "bg-white/70 text-gray-800 border-white/60 hover:border-purple-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default InputPageReal;
