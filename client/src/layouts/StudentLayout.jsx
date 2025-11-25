import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/shared/Navbar";

const StudentLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Students" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 👇 This is where StudentDashboard or any other nested route will render */}
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
