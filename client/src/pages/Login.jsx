import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Beaker,
  FlaskConical,
  Brain,
  Eye,
  Hand,
  User,
  Key,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [fullname, setFullname] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const floatingIcons = [
    { Icon: Beaker, delay: 0, duration: 20 },
    { Icon: FlaskConical, delay: 2, duration: 25 },
    { Icon: Brain, delay: 4, duration: 22 },
    { Icon: Eye, delay: 1, duration: 24 },
    { Icon: Hand, delay: 3, duration: 21 },
    { Icon: Zap, delay: 5, duration: 23 },
    { Icon: Sparkles, delay: 2.5, duration: 26 },
  ];
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        // Registration flow
        const { data } = await api.post("/api/auth/register", {
          username,
          password,
          fullname,
          role: "student",
        });

        alert(data.message || "✅ Account created! Please login now.");
        setIsRegister(false);
        setFullname("");
        setPassword("");
        setUsername("");
        return;
      }

      // Login flow
      const { data } = await api.post("/api/auth/login", {
        username,
        password,
      });

      if (!data.user || !data.token) {
        throw new Error("Invalid server response: missing user or token");
      }

      // Store auth data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user._id);

      // Use AuthContext login to update state instantly
      login(data.user, data.token);

      alert(`Welcome ${data.user.username}! Redirecting to dashboard...`);

      // Role-based redirect
      if (data.user.role === "teacher") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Floating science icons */}
      {floatingIcons.map(({ Icon, delay, duration }, index) => (
        <div
          key={index}
          className="absolute text-white opacity-20 pointer-events-none"
          style={{
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            animation: `float ${duration}s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }}
        >
          <Icon size={Math.random() * 30 + 40} />
        </div>
      ))}

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-30px) rotate(5deg);
          }
          50% {
            transform: translateY(-50px) rotate(-5deg);
          }
          75% {
            transform: translateY(-20px) rotate(3deg);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #ffd700 50%, #fff 100%);
          background-size: 1000px 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Welcome Screen */}
      {showWelcome && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer transition-opacity duration-500"
          onClick={() => setShowWelcome(false)}
        >
          <div className="text-center space-y-8 p-8">
            <div className="inline-block">
              <Sparkles className="w-24 h-24 text-yellow-300 mx-auto mb-6 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white shimmer-text leading-tight">
              Welcome to
              <br />
              Sensory Learning
              <br />
              Companion
            </h1>
            <div className="flex items-center justify-center gap-3 text-white text-2xl animate-bounce">
              <Hand className="w-8 h-8" />
              <p className="font-semibold">Click anywhere to start!</p>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      {!showWelcome && (
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white bg-opacity-95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border-4 border-white border-opacity-50">
            {/* Logo area with science theme */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-full p-6 mb-4 inline-block">
                  <Brain className="w-16 h-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {isRegister ? "Join the Adventure!" : "Sensory Learning"}
              </h2>
              <p className="text-gray-600 font-medium">
                {isRegister
                  ? "Create your account 🎉"
                  : "Learn Science with Fun! 🚀"}
              </p>
            </div>

            <div className="space-y-6">
              {/* Full Name - Only for Register */}
              {isRegister && (
                <div>
                  <label
                    htmlFor="fullname"
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    ✨ Full Name
                  </label>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-3.5 h-5 w-5 text-purple-500" />
                    <input
                      id="fullname"
                      name="fullname"
                      type="text"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 border-2 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-500 border-gray-300 transition-all text-gray-800 font-medium outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  👤 Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-5 w-5 text-purple-500" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border-2 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-500 border-gray-300 transition-all text-gray-800 font-medium outline-none"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  🔑 Password
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-3.5 h-5 w-5 text-purple-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border-2 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-500 border-gray-300 transition-all text-gray-800 font-medium outline-none"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isRegister
                      ? "Creating Account..."
                      : "Starting Adventure..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {isRegister ? "Create Account!" : "Start Learning!"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>

              {/* Toggle between Login and Register */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setFullname("");
                    setPassword("");
                  }}
                  className="text-purple-600 hover:text-pink-600 font-semibold text-sm transition-colors underline"
                >
                  {isRegister
                    ? "Already have an account? Login here!"
                    : "New here? Create an account!"}
                </button>
              </div>
            </div>

            {/* Fun footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                <span className="font-semibold">Watch</span>
                <Hand className="w-4 h-4 text-pink-500" />
                <span className="font-semibold">Feel</span>
                <Brain className="w-4 h-4 text-orange-500" />
                <span className="font-semibold">Learn!</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
