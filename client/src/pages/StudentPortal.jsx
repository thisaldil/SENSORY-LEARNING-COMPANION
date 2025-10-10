import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StudentDashboard from "./student/StudentDashboard";
import StudentLayout from "../layouts/StudentLayout";
// import StudentProfile from "../pages/student/StudentProfile";
import { useAuth } from "../context/AuthContext";

const StudentPortal = () => {
  const { isAuthenticated, userRole } = useAuth();

  // Redirect if not authenticated or not a customer
  if (!isAuthenticated || userRole !== "student") {
    return <Navigate to="/login" replace />;
  }

  return (
    <StudentLayout>
      <Routes>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="learn" element={<StudentDashboard />} />
        {/* <Route path="profile" element={<StudentProfile />} /> */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </StudentLayout>
  );
};

export default StudentPortal;
