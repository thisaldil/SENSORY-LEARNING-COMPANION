import { useState } from "react";
import { fetchAnimation } from "../services/api";

export default function ConceptForm({ onScriptLoaded }) {
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!concept.trim()) return;
    setLoading(true);

    try {
      const data = await fetchAnimation(concept.trim());
      onScriptLoaded(data.script); // send JS script to canvas
    } catch (err) {
      alert("Failed to load animation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white h-full flex flex-col justify-center gap-4 shadow-lg">
      <h2 className="text-xl font-bold text-gray-700">Enter Concept</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="e.g., photosynthesis"
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Generate Animation"}
        </button>
      </form>
    </div>
  );
}
