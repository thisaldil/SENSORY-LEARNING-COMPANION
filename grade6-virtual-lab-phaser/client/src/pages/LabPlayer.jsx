import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchLab, fetchResult, upsertResult } from "../api.js";
import ObjectiveCard from "../components/ObjectiveCard.jsx";
import MaterialsPanel from "../components/MaterialsPanel.jsx";
import ObservationTable from "../components/ObservationTable.jsx";
import ResultCard from "../components/ResultCard.jsx";
import SimHost from "../components/sim/SimHost.jsx";

/* Score model: 70 pts for 5+ recordings, 30 pts for correctness bonus */
function computeScore(rows) {
  const base    = Math.min(70, Math.round((rows.length / 5) * 70));
  const complete = rows.length >= 5;
  return { score: base, complete };
}

export default function LabPlayer() {
  const { labId } = useParams();

  const [lab, setLab]           = useState(null);
  const [labError, setLabError] = useState("");

  const [studentId, setStudentId] = useState(
    () => localStorage.getItem("studentId") || ""
  );
  const effectiveId = useMemo(
    () => studentId.trim() || "guest",
    [studentId]
  );

  const [result, setResult]         = useState(null);
  const [rows, setRows]             = useState([]);
  const [measurement, setMeasurement] = useState({});
  const [resultError, setResultError] = useState("");
  const [saving, setSaving]         = useState(false);

  /* ── Fetch lab ── */
  useEffect(() => {
    setLabError("");
    setLab(null);
    fetchLab(labId)
      .then(setLab)
      .catch((e) => setLabError(e.message || "Failed to load lab"));
  }, [labId]);

  /* ── Fetch result ── */
  useEffect(() => {
    if (!labId) return;
    setResultError("");
    fetchResult(effectiveId, labId)
      .then((r) => {
        setResult(r);
        setRows(r?.data?.rows ?? []);
      })
      .catch((e) => setResultError(e.message || "Failed to load result"));
  }, [labId, effectiveId]);

  /* ── Save helper ── */
  const save = useCallback(
    async (nextData, nextScore = 0, nextComplete = false) => {
      setSaving(true);
      setResultError("");
      try {
        const saved = await upsertResult({
          studentId: effectiveId,
          labId,
          data: nextData,
          score: nextScore,
          isComplete: nextComplete,
        });
        setResult(saved);
        setRows(saved?.data?.rows ?? []);
      } catch (e) {
        setResultError(e.message || "Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [effectiveId, labId]
  );

  /* ── Record a reading ── */
  const onRecord = useCallback(() => {
    const nextRows = [
      ...rows,
      { ...measurement, t: new Date().toLocaleTimeString() },
    ];
    const { score, complete } = computeScore(nextRows);
    save({ ...(result?.data ?? {}), rows: nextRows }, score, complete);
  }, [rows, measurement, result, save]);

  /* ── Clear records ── */
  const onClear = useCallback(() => {
    save({ rows: [] }, 0, false);
  }, [save]);

  /* ── Student input ── */
  const onStudentChange = (e) => {
    setStudentId(e.target.value);
    localStorage.setItem("studentId", e.target.value);
  };

  /* ── States ── */
  if (labError) {
    return (
      <div className="error-box fade-in" style={{ opacity: 0, marginTop: 20 }}>
        ❌ {labError}
      </div>
    );
  }

  if (!lab) {
    return (
      <p className="loading-state fade-in" style={{ opacity: 0, marginTop: 40, textAlign: "center" }}>
        Loading lab…
      </p>
    );
  }

  const hasMeasurement = Object.keys(measurement).length > 0;
  const tableCols = rows.length > 0
    ? Object.keys(rows[0])
    : Object.keys(measurement).length > 0
      ? [...Object.keys(measurement), "t"]
      : ["t"];

  return (
    <div className="grid fade-in" style={{ opacity: 0 }}>

      {/* ── Top bar: title + student input ── */}
      <div className="card card-sm">
        <div className="card-accent-bar" />
        <div className="row-between">
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <span className="chip chip-blue">{lab.chapter}</span>
              <span className="label">{lab.labKey}</span>
            </div>
            <h1 className="section-title">{lab.title}</h1>
          </div>

          <div className="student-row">
            <span className="student-label">Student</span>
            <div className="student-input">
              <input
                type="text"
                value={studentId}
                onChange={onStudentChange}
                placeholder="Enter name…"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content: left bigger, right sidebar ── */}
      <div className="grid lab-layout">

        {/* Left column */}
        <div className="grid">

          {/* Simulation card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🎮 Simulation</span>
              <button
                className="btn btn-record"
                onClick={onRecord}
                disabled={saving || !hasMeasurement}
                title={!hasMeasurement ? "Run the sim first to get readings" : "Record current reading"}
              >
                {saving ? "Saving…" : "Record Reading ✍️"}
              </button>
            </div>

            <p className="muted" style={{ marginBottom: 12, fontSize: 12.5 }}>
              Interact with the simulation, then press <strong style={{ color: "var(--text-1)" }}>Record</strong> to save a reading to the table.
            </p>

            <div className="canvas-wrap">
              <SimHost
                labKey={lab.labKey}
                config={lab.config}
                onMeasurement={setMeasurement}
              />
            </div>

            {/* Live readings strip */}
            <div style={{ marginTop: 12 }}>
              <div className="live-strip">
                <div className="live-strip-dot" />
                {hasMeasurement ? (
                  Object.entries(measurement).map(([k, v]) => (
                    <div key={k} className="live-kv">
                      <span className="live-k">{k}</span>
                      <span className="live-v">{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <span className="mono" style={{ color: "var(--text-3)" }}>
                    Waiting for simulation data…
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Observation table */}
          <ObservationTable columns={tableCols} rows={rows} />
        </div>

        {/* Right sidebar */}
        <div className="grid" style={{ alignContent: "start" }}>

          <ObjectiveCard objective={lab.objective} />

          <MaterialsPanel materials={lab.materials} />

          {resultError && (
            <div className="error-box">⚠️ {resultError}</div>
          )}

          <ResultCard result={result} onClear={onClear} saving={saving} />
        </div>
      </div>
    </div>
  );
}