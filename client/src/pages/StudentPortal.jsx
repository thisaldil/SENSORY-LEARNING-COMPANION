import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StudentDashboard from "./student/StudentDashboard";
import StudentLayout from "../layouts/StudentLayout";
import { useAuth } from "../context/AuthContext";

// Educational Scene Generator Imports
import InputPage from "./IT22551252/InputPage";
import OutputPage from "./IT22551252/OutputPage";
import OfflineModePage from "./IT22551252/OfflineModePage";
import Layout from "../components/IT22551252/Layout";

const StudentPortal = () => {
  const { isAuthenticated, userRole } = useAuth();

  // Redirect if not authenticated or not a student
  if (!isAuthenticated || userRole !== "student") {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      {/* Student Section */}
      <Route path="/" element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Generator Section */}
      <Route path="generator" element={<Layout />}>
        <Route index element={<Navigate to="input" replace />} />
        <Route path="input" element={<InputPage />} />
        <Route path="output" element={<OutputPage />} />
        <Route path="offline" element={<OfflineModePage />} />
      </Route>
    </Routes>
  );
};

export default StudentPortal;
