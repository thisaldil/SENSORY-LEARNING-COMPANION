import React, { useRef, useEffect } from "react";

function formatValue(v) {
  if (v === null || v === undefined) return "—";
  return String(v);
}

function formatColumnHeader(col) {
  // prettify camelCase / snake_case / lowercase keys
  return col
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toUpperCase();
}

export default function ObservationTable({ columns, rows }) {
  const cols = columns?.length ? columns : ["t"];
  const prevLen = useRef(0);

  // Track which rows are newly added for animation
  const newRowIndex = rows.length > prevLen.current ? rows.length - 1 : -1;
  useEffect(() => { prevLen.current = rows.length; }, [rows.length]);

  return (
    <div className="card card-sm">
      <div className="card-header">
        <span className="card-title">📋 Observations</span>
        <div className="row" style={{ gap: 8 }}>
          {rows.length > 0 && (
            <span className="chip chip-green">
              {rows.length} reading{rows.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="obs-table-wrap">
        <table className="obs-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              {cols.map((c) => (
                <th key={c}>{formatColumnHeader(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={cols.length + 1} className="obs-table-empty">
                  No readings yet — run the sim then press Record.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className={i === newRowIndex ? "obs-table-row-new" : ""}>
                  <td className="row-num">{String(i + 1).padStart(2, "0")}</td>
                  {cols.map((c) => (
                    <td key={c}>{formatValue(r?.[c])}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}