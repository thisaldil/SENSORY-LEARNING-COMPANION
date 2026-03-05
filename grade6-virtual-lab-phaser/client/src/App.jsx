import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LabList from "./pages/LabList.jsx";
import LabPlayer from "./pages/LabPlayer.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"           element={<Navigate to="/labs" replace />} />
        <Route path="/labs"       element={<LabList />} />
        <Route path="/labs/:labId" element={<LabPlayer />} />
        <Route path="*"           element={<Navigate to="/labs" replace />} />
      </Routes>
    </Layout>
  );
}