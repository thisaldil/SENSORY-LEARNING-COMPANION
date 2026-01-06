import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { BookOpenIcon, CloudIcon, HomeIcon } from "lucide-react";

export function Navigation() {
  const isOffline = !navigator.onLine;
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-md">
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-[#FFD580] py-2 px-4 text-center text-sm font-medium">
          You are currently offline. Some features may be limited.
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Title → now clickable to go back to Student Dashboard */}
          <button
            onClick={() => navigate("/student/dashboard")}
            className="text-xl font-bold text-gray-800 hover:text-[#1E7038] transition-colors cursor-pointer"
          >
            Dashboard
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              <NavItem
                to="/student/generator/input"
                icon={<HomeIcon size={18} />}
                label="Generate Scene & Script"
              />
              <NavItem
                to="/student/generator/output"
                icon={<BookOpenIcon size={18} />}
                label="View Generated Scene"
              />
              <NavItem
                to="/student/generator/offline"
                icon={<CloudIcon size={18} />}
                label="Offline Mode"
              />
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu (hidden by default) */}
      <div className="hidden md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <MobileNavItem
            to="/student/generator/input"
            label="Generate Scene & Script"
          />
          <MobileNavItem
            to="/student/generator/output"
            label="View Generated Scene"
          />
          <MobileNavItem to="/student/generator/offline" label="Offline Mode" />
        </div>
      </div>
    </div>
  );
}

// --- Desktop Navigation Item ---
function NavItem({ to, icon, label }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive
              ? "text-[#16542B] bg-green-50"
              : "text-gray-600 hover:text-[#1E7038] hover:bg-gray-50"
          }`
        }
      >
        <span className="mr-2">{icon}</span>
        {label}
      </NavLink>
    </li>
  );
}

// --- Mobile Navigation Item ---
function MobileNavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md text-base font-medium ${
          isActive
            ? "text-[#16542B] bg-green-50"
            : "text-gray-600 hover:text-[#1E7038] hover:bg-gray-50"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
