import React from "react";

export default function ResultCard({ result, onClear, saving }) {
  const score      = result?.score ?? 0;
  const isComplete = result?.isComplete ?? false;
  const attempts   = result?.attempts ?? 0;
  const rowCount   = result?.data?.rows?.length ?? 0;

  const pct = Math.min(100, score);
  const scoreColor = score >= 70 ? "var(--green)" : score >= 40 ? "var(--amber)" : "var(--text-2)";

  return (
    <div className="card card-sm">
      <div className="card-header">
        <span className="card-title">✅ Progress</span>
        {isComplete && <span className="chip chip-green">Complete 🎉</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
        <div className="score-ring-wrap">
          <div className="score-number" style={{ color: scoreColor }}>{score}</div>
          <div className="score-denom">/ 100</div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${pct}%`, background: score >= 70 ? "linear-gradient(90deg, var(--green-dim), var(--green))" : "linear-gradient(90deg, var(--accent-dim), var(--accent))" }}
            />
          </div>
          <div className="mono" style={{ marginTop: 6, fontSize: 10 }}>
            {pct}% · {rowCount} readings recorded
          </div>
        </div>
      </div>

      <div className="divider" style={{ margin: "10px 0" }} />

      <div className="score-stat">
        <span className="score-stat-label">Attempts</span>
        <span className="score-stat-value">{attempts}</span>
      </div>
      <div className="score-stat">
        <span className="score-stat-label">Status</span>
        <span className="score-stat-value" style={{ color: isComplete ? "var(--green)" : "var(--text-3)" }}>
          {isComplete ? "Done" : "In Progress"}
        </span>
      </div>

      <div style={{ marginTop: 14 }}>
        <button
          className="btn btn-danger"
          style={{ fontSize: 10, width: "100%", justifyContent: "center" }}
          onClick={onClear}
          disabled={saving}
        >
          {saving ? "Saving…" : "🧹 Clear My Records"}
        </button>
      </div>
    </div>
  );
}