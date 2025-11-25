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

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUserRole(parsedUser.role || null);
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, []);

  // ✅ Login
  const login = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
    setUserRole(userData.role || null);

    localStorage.setItem("user", JSON.stringify(userData));
    if (token) localStorage.setItem("token", token);
  };

  // ✅ Logout
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
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
