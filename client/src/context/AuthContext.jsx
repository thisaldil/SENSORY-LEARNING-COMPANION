import React, { useState, useEffect, createContext, useContext } from "react";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 for hydration

  // ✅ Restore auth from localStorage on first load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      // Default role to "student" if not provided
      const userWithRole = {
        ...parsedUser,
        role: parsedUser.role || "student"
      };
      setUser(userWithRole);
      setUserRole(userWithRole.role);
      setIsAuthenticated(true);
      
      // Ensure userId is also in localStorage if missing
      // FastAPI uses 'id' instead of '_id'
      if (!storedUserId && (parsedUser.id || parsedUser._id)) {
        localStorage.setItem("userId", parsedUser.id || parsedUser._id);
      }
    }

    setLoading(false);
  }, []);

  // ✅ Login
  const login = (userData, token) => {
    // Default role to "student" if not provided (backend doesn't return role in login response)
    const userWithRole = {
      ...userData,
      role: userData.role || "student"
    };
    
    setIsAuthenticated(true);
    setUser(userWithRole);
    setUserRole(userWithRole.role);

    localStorage.setItem("user", JSON.stringify(userWithRole));
    if (token) localStorage.setItem("token", token);
    // FastAPI uses 'id' instead of '_id'
    if (userData.id || userData._id) {
      localStorage.setItem("userId", userData.id || userData._id);
    }
  };

  // ✅ Logout
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        userRole,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
