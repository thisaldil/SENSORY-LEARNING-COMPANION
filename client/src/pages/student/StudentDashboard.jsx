import React, { useEffect, useState } from "react";
import {
  Brain,
  Hand,
  Headphones,
  Video,
  BookOpen,
  Trophy,
  Star,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({
    completed: 0,
    inProgress: 0,
    total: 0,
    points: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user
  useEffect(() => {
    const fetchUser = async () => {
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
      } catch (err) {
        console.error("User fetch error", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Load lessons
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        // Replace with backend later
        const mockLessons = [
          {
            _id: "1",
            title: "The Water Cycle",
            subject: "Earth Science",
            hasVideo: true,
            hasAudio: true,
            hasHaptics: true,
            progress: 75,
            status: "in-progress",
            duration: "15 min",
            points: 50,
          },
          {
            _id: "2",
            title: "States of Matter",
            subject: "Physical Science",
            hasVideo: true,
            hasAudio: true,
            hasHaptics: true,
            progress: 100,
            status: "completed",
            duration: "12 min",
            points: 60,
          },
          {
            _id: "3",
            title: "Plant Cells",
            subject: "Life Science",
            hasVideo: true,
            hasAudio: true,
            hasHaptics: true,
            progress: 0,
            status: "not-started",
            duration: "18 min",
            points: 70,
          },
        ];

        setLessons(mockLessons);

        const completed = mockLessons.filter(l => l.status === "completed").length;
        const inProgress = mockLessons.filter(l => l.status === "in-progress").length;
        const totalPoints = mockLessons
          .filter(l => l.status === "completed")
          .reduce((sum, l) => sum + l.points, 0);

        setProgress({
          completed,
          inProgress,
          total: mockLessons.length,
          points: totalPoints,
        });
      } catch (err) {
        console.error("Lessons error", err);
      }
    };

    fetchLessons();
  }, []);

  const getStatusColor = (status) => {
    if (status === "completed") return "bg-green-100 text-green-700 border-green-300";
    if (status === "in-progress") return "bg-blue-100 text-blue-700 border-blue-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getStatusText = (status) => {
    if (status === "completed") return "Completed ✓";
    if (status === "in-progress") return "In Progress";
    return "Start Learning";
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <p className="text-xl font-bold text-purple-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-purple-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-4">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Welcome Back, {user.fullname}
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Grade 6 Science Explorer
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/student/generator/input")}
              className="flex items-center gap-3 bg-blue-500 rounded-2xl px-8 py-4 text-white font-bold text-lg shadow-xl"
            >
              <Trophy className="w-8 h-8 text-white" />
              Learn Now
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Completed</p>
              <p className="text-3xl font-bold text-green-600">{progress.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{progress.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-full p-3">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Total Lessons</p>
              <p className="text-3xl font-bold text-purple-600">{progress.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Star className="text-yellow-500" /> Your Science Lessons
        </h2>
      </div>

      {lessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <div
              key={lesson._id}
              className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden"
            >
              {lesson.status !== "not-started" && (
                <div className="w-full bg-gray-200 h-2">
                  <div
                    className="bg-green-500 h-2"
                    style={{ width: `${lesson.progress}%` }}
                  ></div>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {lesson.subject}
                  </span>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${getStatusColor(
                      lesson.status
                    )}`}
                  >
                    {getStatusText(lesson.status)}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-3">{lesson.title}</h3>

                <div className="flex gap-2 mb-4">
                  {lesson.hasVideo && (
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Video className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  {lesson.hasAudio && (
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Headphones className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  {lesson.hasHaptics && (
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Hand className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.duration}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 font-bold">
                    <Star className="w-4 h-4" />
                    {lesson.points} pts
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg">
                  {lesson.status === "completed"
                    ? "Review Lesson"
                    : lesson.status === "in-progress"
                    ? "Continue Learning"
                    : "Start Lesson"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-500">No lessons available yet</p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
