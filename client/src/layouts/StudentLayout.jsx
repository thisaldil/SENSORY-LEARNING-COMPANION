import React from "react";
import Navbar from "../components/shared/Navbar";

const CustomerLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Students" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default CustomerLayout;
