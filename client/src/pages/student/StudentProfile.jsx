import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Save,
  Mail,
  UserCircle,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit2,
} from "lucide-react";
import api from "../../services/api";

const StudentProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/api/users/me");
        // Transform user data to include fullname from first_name + last_name
        const userData = {
          ...data,
          fullname: data.fullname || 
                   (data.first_name && data.last_name 
                    ? `${data.first_name} ${data.last_name}` 
                    : data.username || data.email || 'User')
        };
        setUser(userData);
        setFormData({
          fullname: userData.fullname || "",
          username: userData.username || "",
          email: userData.email || "",
        });
      } catch (err) {
        console.error("Profile fetch error", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
        setMessage({
          type: "error",
          text: "Failed to load profile. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const { data } = await api.put("/api/users/me", formData);
      setUser(data);
      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
      setIsEditing(false);

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (err) {
      console.error("Profile update error", err);
      setMessage({
        type: "error",
        text:
          err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      fullname: user.fullname || "",
      username: user.username || "",
      email: user.email || "",
    });
    setIsEditing(false);
    setMessage({ type: "", text: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-purple-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-700">
            Failed to load profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate("/student/dashboard")}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-purple-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-4">
                  <UserCircle className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    My Profile
                  </h1>
                  <p className="text-gray-600 text-lg mt-1">
                    Manage your account settings
                  </p>
                </div>
              </div>
              {!isEditing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit Profile
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Message Banner */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl border-2 ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <p className="font-semibold">{message.text}</p>
            </div>
          </motion.div>
        )}

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl p-8 border-4 border-purple-200"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullname"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all ${
                  isEditing
                    ? "border-purple-300 focus:ring-4 focus:ring-purple-300 focus:border-purple-500"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                } text-gray-800 font-medium outline-none`}
                placeholder="Enter your full name"
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                <UserCircle className="w-4 h-4 inline mr-2" />
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all ${
                  isEditing
                    ? "border-purple-300 focus:ring-4 focus:ring-purple-300 focus:border-purple-500"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                } text-gray-800 font-medium outline-none`}
                placeholder="Enter your username"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all ${
                  isEditing
                    ? "border-purple-300 focus:ring-4 focus:ring-purple-300 focus:border-purple-500"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                } text-gray-800 font-medium outline-none`}
                placeholder="Enter your email"
              />
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={user.role || "student"}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl text-gray-600 font-medium cursor-not-allowed"
              />
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-4 pt-4">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentProfile;

