import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IndexedDBService } from "../services/IndexedDBService";
import { CloudOffIcon, TrashIcon, ExternalLinkIcon } from "lucide-react";

export function OfflineModePage() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const savedLessons = await IndexedDBService.getLessons();
      setLessons(savedLessons.sort((a, b) => b.timestamp - a.timestamp));
      setError(null);
    } catch (err) {
      setError("Failed to load saved lessons. Please try again.");
      console.error("Error loading lessons:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLesson = (lesson) => {
    const result = {
      nodes: lesson.nodes,
      links: lesson.links,
      script: lesson.script,
    };
    navigate("/output", { state: { result } });
  };

  const handleDeleteLesson = async (id, e) => {
    e.stopPropagation();
    try {
      await IndexedDBService.deleteLesson(id);
      setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
    } catch (err) {
      setError("Failed to delete lesson. Please try again.");
      console.error("Error deleting lesson:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center mb-6">
          <CloudOffIcon size={28} className="text-[#1E7038] mr-3" />
          <h1 className="text-3xl font-bold">Offline Mode</h1>
        </div>

        {/* Status Banner */}
        <div className="bg-[#FFD580] border border-orange-300 rounded-lg p-4 mb-8">
          <p className="text-orange-800">
            {navigator.onLine
              ? "You're currently online, but your saved lessons are still accessible offline."
              : "You're currently offline. You can access your previously generated lessons here."}
          </p>
        </div>

        {/* Lessons List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-medium">Saved Lessons</h2>
          </div>

          {loading ? (
            // Loading spinner
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E7038]"></div>
            </div>
          ) : error ? (
            // Error message
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : lessons.length === 0 ? (
            // No saved lessons
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No saved lessons found.</p>
              <motion.button
                className="px-4 py-2 bg-[#1E7038] hover:bg-[#16542B] text-white rounded-md"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/input")}
              >
                Create New Lesson
              </motion.button>
            </div>
          ) : (
            // Saved lessons list
            <ul className="divide-y divide-gray-200">
              {lessons.map((lesson) => (
                <motion.li
                  key={lesson.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                  onClick={() => handleOpenLesson(lesson)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(lesson.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="p-2 rounded-full hover:bg-gray-200"
                        onClick={(e) => handleDeleteLesson(lesson.id, e)}
                      >
                        <TrashIcon size={18} className="text-red-500" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-gray-200">
                        <ExternalLinkIcon
                          size={18}
                          className="text-[#1E7038]"
                        />
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
