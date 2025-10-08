import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import StudentPortal from "./pages/StudentPortal";
// import AdminPortal from "./pages/AdminPortal";
import Login from "./pages/Login";

import { AuthProvider, useAuth } from "./context/AuthContext";

// 🔹 Wrapper to handle loading + auth context properly
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/student/*" element={<StudentPortal />} />
      {/* <Route path="/admin/*" element={<AdminPortal />} /> */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
