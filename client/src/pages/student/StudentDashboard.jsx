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

const API_BASE_URL = "http://localhost:5000";

const StudentDashboard = () => {
  const [user, setUser] = useState({ name: "Student", grade: "6" });
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({
    completed: 0,
    inProgress: 0,
    total: 0,
    points: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        // Simulated data - replace with actual API call
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
          {
            _id: "4",
            title: "Force and Motion",
            subject: "Physical Science",
            hasVideo: true,
            hasAudio: true,
            hasHaptics: true,
            progress: 45,
            status: "in-progress",
            duration: "20 min",
            points: 80,
          },
          {
            _id: "5",
            title: "The Solar System",
            subject: "Earth Science",
            hasVideo: true,
            hasAudio: true,
            hasHaptics: false,
            progress: 0,
            status: "not-started",
            duration: "25 min",
            points: 90,
          },
          {
            _id: "6",
            title: "Photosynthesis",
            subject: "Life Science",
            hasVideo: true,
            hasAudio: true,
            hasHaptics: true,
            progress: 100,
            status: "completed",
            duration: "16 min",
            points: 65,
          },
        ];

        setLessons(mockLessons);

        const completed = mockLessons.filter(
          (l) => l.status === "completed"
        ).length;
        const inProgress = mockLessons.filter(
          (l) => l.status === "in-progress"
        ).length;
        const totalPoints = mockLessons
          .filter((l) => l.status === "completed")
          .reduce((sum, l) => sum + l.points, 0);

        setProgress({
          completed,
          inProgress,
          total: mockLessons.length,
          points: totalPoints,
        });
      } catch (err) {
        console.error("Error fetching lessons:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "in-progress":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed ✓";
      case "in-progress":
        return "In Progress";
      default:
        return "Start Learning";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-purple-600">
            Loading your learning journey...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-purple-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-4">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome Back, {user.name}! 🎉
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Grade {user.grade} Science Explorer
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl px-6 py-3 shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
              <div className="text-white">
                <p className="text-sm font-semibold">Total Points</p>
                <p className="text-2xl font-bold">{progress.points}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {progress.completed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">
                {progress.inProgress}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-full p-3">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">
                Total Lessons
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {progress.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Modes Info */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-pink-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles className="text-pink-500" /> Your Learning Superpowers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
            <Video className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-bold text-blue-700">Watch Videos</p>
              <p className="text-sm text-blue-600">See concepts come alive!</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
            <Headphones className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-bold text-green-700">Listen & Learn</p>
              <p className="text-sm text-green-600">Audio explanations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
            <Hand className="w-8 h-8 text-purple-600" />
            <div>
              <p className="font-bold text-purple-700">Feel It!</p>
              <p className="text-sm text-purple-600">Haptic feedback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Grid */}
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
              className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-purple-100 hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              {/* Progress Bar */}
              {lesson.status !== "not-started" && (
                <div className="w-full bg-gray-200 h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 transition-all duration-500"
                    style={{ width: `${lesson.progress}%` }}
                  ></div>
                </div>
              )}

              <div className="p-6">
                {/* Subject Badge */}
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

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {lesson.title}
                </h3>

                {/* Learning Modes Available */}
                <div className="flex gap-2 mb-4">
                  {lesson.hasVideo && (
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Video className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  {lesson.hasAudio && (
                    <div className="bg-green-100 rounded-lg p-2">
                      <Headphones className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  {lesson.hasHaptics && (
                    <div className="bg-purple-100 rounded-lg p-2">
                      <Hand className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                </div>

                {/* Duration and Points */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{lesson.duration}</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 font-bold">
                    <Star className="w-4 h-4" />
                    <span>{lesson.points} pts</span>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg">
                  {lesson.status === "completed"
                    ? "Review Lesson 🔄"
                    : lesson.status === "in-progress"
                    ? "Continue Learning 🚀"
                    : "Start Lesson 🎯"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-500">
            No lessons available yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
