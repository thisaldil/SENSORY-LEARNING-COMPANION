import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Navigation } from "./Navigation";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <motion.main
        className="container mx-auto py-8 px-4 md:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 👇 This is where the nested route content (InputPage, OutputPage, etc.) will be injected */}
        <Outlet />
      </motion.main>
    </div>
  );
}
