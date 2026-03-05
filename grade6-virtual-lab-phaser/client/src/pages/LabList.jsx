import React, { useEffect, useState, useMemo } from "react";
import { fetchLabs } from "../api.js";
import LabCard from "../components/LabCard.jsx";

export default function LabList() {
  const [labs, setLabs]   = useState([]);
  const [err, setErr]     = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setErr("");
    setLoading(true);
    fetchLabs()
      .then(setLabs)
      .catch((e) => setErr(e.message || "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return labs;
    const q = search.toLowerCase();
    return labs.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.chapter?.toLowerCase().includes(q) ||
        l.labKey?.toLowerCase().includes(q)
    );
  }, [labs, search]);

  return (
    <div className="grid">
      {/* Header */}
      <div className="fade-in" style={{ opacity: 0 }}>
        <div className="row-between" style={{ marginBottom: 6 }}>
          <div>
            <p className="label label-accent" style={{ marginBottom: 6 }}>Grade 6 Science</p>
            <h1 className="page-title">Virtual Lab Experiments</h1>
          </div>
          <div style={{ width: 220 }}>
            <input
              type="search"
              placeholder="Search labs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Select a lab to open the simulation. Run the experiment, record readings, and review your score.
        </p>
      </div>

      {/* Error */}
      {err && (
        <div className="error-box fade-in" style={{ opacity: 0 }}>
          ❌ {err}
          <br />
          <span style={{ color: "var(--text-3)", marginTop: 4, display: "block" }}>
            Make sure the backend is running: <code style={{ color: "var(--amber)" }}>npm run dev</code> in the server folder.
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && !err && (
        <p className="loading-state fade-in" style={{ opacity: 0 }}>Loading labs…</p>
      )}

      {/* Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-auto">
          {filtered.map((lab, i) => (
            <LabCard key={lab._id} lab={lab} index={i} />
          ))}
        </div>
      )}

      {!loading && !err && labs.length > 0 && filtered.length === 0 && (
        <p className="muted mono">No labs match "{search}"</p>
      )}

      {/* Footer note */}
      {labs.length > 0 && (
        <p className="mono" style={{ textAlign: "center", marginTop: 8 }}>
          {labs.length} experiment{labs.length !== 1 ? "s" : ""} available
        </p>
      )}
    </div>
  );
}