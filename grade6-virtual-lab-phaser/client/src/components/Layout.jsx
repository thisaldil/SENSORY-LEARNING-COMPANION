import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isLab = location.pathname.startsWith("/labs/") && location.pathname.length > 7;

  return (
    <div className="app-shell">
      <nav className="topnav">
        <div className="topnav-brand">
          <Link to="/labs" className="topnav-logo">
            Virtual<span>Lab</span>
          </Link>
          <span className="topnav-badge">Grade 6</span>
        </div>

        <div className="row">
          {isLab && (
            <Link to="/labs" className="btn btn-ghost" style={{ fontSize: 10 }}>
              ← All Labs
            </Link>
          )}
          {!isLab && (
            <span className="mono" style={{ opacity: 0.4 }}>
              Phaser · React · MongoDB
            </span>
          )}
        </div>
      </nav>

      <main className="page-container">
        {children}
      </main>
    </div>
  );
}