import axios from "axios";

// Get server URL from environment variable (defined in .env file)
// Format: VITE_API_URL=http://localhost:5001
const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Create axios instance with base configuration
// All API calls will be prefixed with this baseURL
// Example: api.post("/api/auth/register") becomes {SERVER_URL}/api/auth/register
const api = axios.create({
  baseURL: SERVER_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

