import { useState } from "react";
import { getAnimation } from "../services/api";

export default function ConceptForm({ onScriptLoaded }) {
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("hybrid"); // Default to hybrid

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await getAnimation(concept, mode);
      console.log("Response from backend:", response);
      const { script } = response;

      if (!script) {
        console.error("No script in response:", response);
        alert("No script received from backend. Check console.");
        setLoading(false);
        return;
      }

      console.log("Script received:", script);
      console.log("Script type:", typeof script);
      // Pass script (JSON object) and concept text
      onScriptLoaded({ script, conceptText: concept });
    } catch (err) {
      console.error("Backend error:", err);
      alert(`Backend error: ${err.message || "Check console."}`);
    }

    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "10px" }}
    >
      <textarea
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        placeholder="Describe the concept you want to visualize...&#10;&#10;Example:&#10;Gravity is a force that pulls objects toward each other. The larger the mass, the stronger the pull. On Earth, objects fall at 9.8 m/s²."
        rows={6}
        style={{
          width: "100%",
          padding: "12px 15px",
          borderRadius: "8px",
          border: "1px solid #d1d9e0",
          background: "#ffffff",
          color: "#1f2328",
          fontFamily: "inherit",
          resize: "vertical",
          minHeight: "120px",
        }}
      />

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <label style={{ fontSize: "14px", fontWeight: "500", color: "#1f2328" }}>
          Generation Mode:
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d9e0",
            background: "#ffffff",
            color: "#1f2328",
            fontFamily: "inherit",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <option value="hybrid">Hybrid (AI + Rules)</option>
          <option value="legacy">Legacy (AI Only)</option>
        </select>
        <small style={{ opacity: 0.7, fontSize: "11px", color: "#656d76" }}>
          {mode === "hybrid"
            ? "✨ Recommended: Stable & predictable"
            : "⚠️ Experimental: May vary"}
        </small>
      </div>

      <button
        type="submit"
        disabled={loading || !concept.trim()}
        style={{
          padding: "12px 20px",
          border: "none",
          borderRadius: "8px",
          background: loading || !concept.trim() ? "#94d3a2" : "#0969da",
          color: "white",
          fontWeight: "bold",
          cursor: loading || !concept.trim() ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Generating Visualization..." : "Generate Animation"}
      </button>

      {concept.trim() && (
        <small style={{ opacity: 0.7, fontSize: "12px", color: "#656d76" }}>
          💡 Tip: Describe the concept in detail for better visualizations
        </small>
      )}
    </form>
  );
}
