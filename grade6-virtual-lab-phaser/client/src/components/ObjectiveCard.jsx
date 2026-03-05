import React from "react";

export default function ObjectiveCard({ objective }) {
  return (
    <div className="card card-sm">
      <div className="card-accent-bar" />
      <div className="card-header" style={{ marginBottom: 8 }}>
        <span className="card-title">🎯 Objective</span>
      </div>
      <p className="objective-text">{objective}</p>
    </div>
  );
}