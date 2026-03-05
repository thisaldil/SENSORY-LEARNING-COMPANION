import React from "react";

export default function MaterialsPanel({ materials = [] }) {
  if (!materials?.length) return null;

  return (
    <div className="card card-sm">
      <div className="card-header">
        <span className="card-title">🧰 Materials</span>
        <span className="mono" style={{ color: "var(--text-3)" }}>
          {materials.length} items
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
        {materials.map((m) => (
          <div key={m} className="material-item">
            <div className="material-dot" />
            <span>{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}