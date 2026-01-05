import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  FileAudio,
  FileImage,
  Sparkles,
  Type,
  UploadCloud,
} from "lucide-react";
import {
  processImage,
  processText,
  processVoice,
} from "../../services/IT22551252/OcrNlpService";

function InputPageReal() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("text"); // text | image | voice
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (activeTab === "text") return text.trim().length > 0;
    if (activeTab === "image") return Boolean(imageFile);
    if (activeTab === "voice") return Boolean(voiceFile);
    return false;
  }, [activeTab, imageFile, loading, text, voiceFile]);

  const resetErrors = () => setError(null);

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

    resetErrors();
    if (activeTab === "image") setImageFile(file);
    if (activeTab === "voice") setVoiceFile(file);
  };

  const submit = async () => {
    try {
      resetErrors();
      setLoading(true);

      let result;
      if (activeTab === "text") {
        const trimmed = text.trim();
        if (!trimmed) throw new Error("Please enter some text to process.");
        result = await processText(trimmed);
      } else if (activeTab === "image") {
        if (!imageFile) throw new Error("Please choose an image to process.");
        result = await processImage(imageFile);
      } else if (activeTab === "voice") {
        if (!voiceFile) throw new Error("Please choose an audio file to process.");
        result = await processVoice(voiceFile);
      }

      navigate("/student/generator/output", { state: { result } });
    } catch (err) {
      setError(
        typeof err?.message === "string" && err.message
          ? err.message
          : "Failed to process your input. Please try again."
      );
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
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
            Paste text, upload an image, or upload voice audio — we’ll generate a
            scene graph and narration script.
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
              onClick={() => {
                setActiveTab("text");
                resetErrors();
              }}
              icon={<Type className="w-5 h-5" />}
              label="Process Text"
            />
            <TabButton
              active={activeTab === "image"}
              onClick={() => {
                setActiveTab("image");
                resetErrors();
              }}
              icon={<FileImage className="w-5 h-5" />}
              label="Process Image"
            />
            <TabButton
              active={activeTab === "voice"}
              onClick={() => {
                setActiveTab("voice");
                resetErrors();
              }}
              icon={<FileAudio className="w-5 h-5" />}
              label="Process Voice"
            />
          </div>

          <div className="p-4 sm:p-6">
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            {/* Inputs */}
            {activeTab === "text" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Text Input
                </label>
                <textarea
                  className="w-full min-h-40 p-4 rounded-2xl border-2 border-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-200 bg-white"
                  placeholder="Paste a science paragraph here..."
                  value={text}
                  onChange={(e) => {
                    resetErrors();
                    setText(e.target.value);
                  }}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {activeTab === "image" ? "Image Upload" : "Voice Upload"}
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
                  onClick={() => {
                    if (activeTab === "image") {
                      document.getElementById("slc-image-upload")?.click();
                    } else {
                      document.getElementById("slc-voice-upload")?.click();
                    }
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-700 font-medium">
                    Drag & drop, or click to select a file
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {activeTab === "image"
                      ? "Supported: JPG, PNG, PDF"
                      : "Supported: WAV, MP3, M4A"}
                  </p>

                  {activeTab === "image" ? (
                    <input
                      id="slc-image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          resetErrors();
                          setImageFile(file);
                        }
                      }}
                    />
                  ) : (
                    <input
                      id="slc-voice-upload"
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          resetErrors();
                          setVoiceFile(file);
                        }
                      }}
                    />
                  )}
                </motion.div>

                {activeTab === "image" && imageFile && (
                  <div className="mt-3 text-sm text-gray-700">
                    Selected: <span className="font-semibold">{imageFile.name}</span>
                  </div>
                )}
                {activeTab === "voice" && voiceFile && (
                  <div className="mt-3 text-sm text-gray-700">
                    Selected: <span className="font-semibold">{voiceFile.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                Uses APIs: <span className="font-mono">/api/ocr-nlp/process-text</span>,{" "}
                <span className="font-mono">/process-image</span>,{" "}
                <span className="font-mono">/process-voice</span>
              </div>

              <motion.button
                whileHover={{ scale: canSubmit ? 1.03 : 1 }}
                whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                disabled={!canSubmit}
                onClick={submit}
                className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl font-bold shadow-xl transition-all ${
                  canSubmit
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-2xl"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-5 h-5" />
                {loading ? "Processing..." : "Generate"}
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
