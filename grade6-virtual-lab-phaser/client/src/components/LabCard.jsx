import React from "react";
import { Link } from "react-router-dom";

const CHAPTER_COLORS = {
  "Chapter 1": "#00aaff",
  "Chapter 2": "#00ffaa",
  "Chapter 3": "#ffcc44",
  "Chapter 4": "#ff6688",
  "Chapter 5": "#cc88ff",
};

function getChipClass(chapter) {
  const num = parseInt(chapter?.replace(/\D/g, "")) || 1;
  const classes = ["chip-blue", "chip-green", "chip-amber", "chip-blue", "chip-green"];
  return classes[(num - 1) % classes.length];
}

export default function LabCard({ lab, index = 0 }) {
  return (
    <Link
      to={`/labs/${lab._id}`}
      className={`lab-card fade-in stagger-${Math.min(index + 1, 5)}`}
      style={{ opacity: 0 }}
    >
      <div className="lab-card-num">
        {String(index + 1).padStart(2, "0")} · {lab.chapter}
      </div>

      <div className="lab-card-title">{lab.title}</div>

      <div className="row" style={{ marginTop: 10 }}>
        <span className={`chip ${getChipClass(lab.chapter)}`}>
          {lab.chapter}
        </span>
        <span className="lab-card-key">{lab.labKey}</span>
      </div>

      <div className="lab-card-arrow">→</div>
    </Link>
  );
}