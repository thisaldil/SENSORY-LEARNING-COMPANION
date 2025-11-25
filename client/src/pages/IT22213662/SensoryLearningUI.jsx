import React, { useState } from "react";
import {
  Brain,
  BookOpen,
  BarChart3,
  Settings,
  User,
  PlayCircle,
  CheckCircle,
  Clock,
  Trophy,
  TrendingUp,
} from "lucide-react";

export default function SensoryLearningUI() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [quizState, setQuizState] = useState({
    inProgress: false,
    currentQuestionIndex: 0,
    answers: [],
    attempts: 0,
    mistakes: 0,
    taps: 0,
    startedAt: null,
    lastInteractionAt: null,
    idleTimeMs: 0,
    score: null,
  });
  const [adaptiveRecommendation, setAdaptiveRecommendation] = useState(null);
  const [adaptationHistory, setAdaptationHistory] = useState([]);
  const [isPredicting, setIsPredicting] = useState(false);

  const lessons = [
    {
      id: 1,
      title: "Introduction to Mathematics",
      progress: 85,
      status: "completed",
      cognitiveLoad: "medium",
    },
    {
      id: 2,
      title: "Basic Algebra",
      progress: 60,
      status: "in-progress",
      cognitiveLoad: "high",
    },
    {
      id: 3,
      title: "Geometry Basics",
      progress: 0,
      status: "not-started",
      cognitiveLoad: "low",
    },
    {
      id: 4,
      title: "Fractions & Decimals",
      progress: 100,
      status: "completed",
      cognitiveLoad: "medium",
    },
  ];

  const recentActivity = [
    {
      action: "Quiz Completed",
      lesson: "Introduction to Mathematics",
      score: 92,
      time: "2 hours ago",
    },
    {
      action: "Practice Activity",
      lesson: "Basic Algebra",
      score: 78,
      time: "5 hours ago",
    },
    {
      action: "Lesson Started",
      lesson: "Geometry Basics",
      score: null,
      time: "1 day ago",
    },
  ];

  const cognitiveStats = {
    avgLoad: "Medium",
    engagement: 87,
    retention: 92,
    adaptiveActivities: 24 + adaptationHistory.length,
  };

  const quizQuestionsByLesson = {
    1: [
      {
        id: 1,
        text: "What is 7 + 5?",
        options: ["10", "11", "12", "13"],
        correctIndex: 2,
      },
      {
        id: 2,
        text: "Which is an even number?",
        options: ["9", "11", "14", "21"],
        correctIndex: 2,
      },
    ],
    2: [
      {
        id: 1,
        text: "Solve for x: 2x + 3 = 11",
        options: ["3", "4", "5", "6"],
        correctIndex: 1,
      },
      {
        id: 2,
        text: "What is 3x when x = 4?",
        options: ["7", "10", "12", "14"],
        correctIndex: 2,
      },
    ],
    3: [
      {
        id: 1,
        text: "A triangle has how many sides?",
        options: ["2", "3", "4", "5"],
        correctIndex: 1,
      },
      {
        id: 2,
        text: "A right angle is:",
        options: ["45°", "60°", "90°", "120°"],
        correctIndex: 2,
      },
    ],
    4: [
      {
        id: 1,
        text: "Which is a fraction?",
        options: ["0.5", "1/2", "2", "5"],
        correctIndex: 1,
      },
      {
        id: 2,
        text: "0.25 is equal to:",
        options: ["1/2", "1/3", "1/4", "3/4"],
        correctIndex: 2,
      },
    ],
  };

  const getCurrentQuestions = () =>
    selectedLesson ? quizQuestionsByLesson[selectedLesson.id] ?? [] : [];

  const startQuizForLesson = (lesson) => {
    setSelectedLesson(lesson);
    setActiveTab("dashboard");
    const now = Date.now();
    setQuizState({
      inProgress: true,
      currentQuestionIndex: 0,
      answers: [],
      attempts: 0,
      mistakes: 0,
      taps: 0,
      startedAt: now,
      lastInteractionAt: now,
      idleTimeMs: 0,
      score: null,
    });
    setAdaptiveRecommendation(null);
  };

  const handleInteraction = () => {
    setQuizState((prev) => {
      const now = Date.now();
      const idleIncrement =
        prev.lastInteractionAt != null
          ? Math.max(0, now - prev.lastInteractionAt)
          : 0;
      return {
        ...prev,
        taps: prev.taps + 1,
        idleTimeMs: prev.idleTimeMs + idleIncrement,
        lastInteractionAt: now,
      };
    });
  };

  const answerQuestion = (optionIndex) => {
    handleInteraction();
    const questions = getCurrentQuestions();
    const current = questions[quizState.currentQuestionIndex];
    if (!current) return;

    const isCorrect = optionIndex === current.correctIndex;

    setQuizState((prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
      mistakes: prev.mistakes + (isCorrect ? 0 : 1),
      answers: [...prev.answers, { questionId: current.id, isCorrect }],
      currentQuestionIndex: isCorrect
        ? prev.currentQuestionIndex + 1
        : prev.currentQuestionIndex,
    }));
  };

  const allQuestionsAnswered = () => {
    const questions = getCurrentQuestions();
    return (
      questions.length > 0 &&
      quizState.answers.filter((a) => a.isCorrect).length >= questions.length
    );
  };

  const simulateServerPrediction = async (payload) => {
    // Simple heuristic-based mock instead of a real ML model
    const { attempts, mistakes, totalTimeMs } =
      payload.interactionMetrics;

    // Use overall quiz score from the payload, not from interaction metrics
    const score = payload.quizScore;

    let load = "medium";
    if (score < 50 || mistakes > attempts * 0.5 || totalTimeMs > 120000) {
      load = "high";
    } else if (score > 85 && mistakes === 0 && totalTimeMs < 45000) {
      load = "low";
    }

    let activity;
    if (load === "high") {
      activity = {
        difficulty: "Easier",
        label: "Guided Practice",
        description:
          "Short, scaffolded practice with hints and step-by-step feedback to reduce overload.",
      };
    } else if (load === "low") {
      activity = {
        difficulty: "Harder",
        label: "Challenge Extension",
        description:
          "More complex, multi-step problems designed to increase challenge and prevent underload.",
      };
    } else {
      activity = {
        difficulty: "Balanced",
        label: "Adaptive Drill",
        description:
          "A mixed set of items that keeps you engaged at an optimal difficulty level.",
      };
    }

    // Simulate network latency
    await new Promise((res) => setTimeout(res, 600));

    return {
      predictedLoad: load,
      recommendedActivity: activity,
    };
  };

  const submitQuizForAdaptation = async () => {
    if (!selectedLesson) return;
    const questions = getCurrentQuestions();
    if (!questions.length) return;

    const correctCount = quizState.answers.filter((a) => a.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const totalTimeMs =
      quizState.startedAt != null ? Date.now() - quizState.startedAt : 0;

    const payload = {
      lessonId: selectedLesson.id,
      quizScore: score,
      interactionMetrics: {
        taps: quizState.taps,
        attempts: quizState.attempts,
        mistakes: quizState.mistakes,
        totalTimeMs,
        idleTimeMs: quizState.idleTimeMs,
      },
    };

    setIsPredicting(true);
    const result = await simulateServerPrediction(payload);
    setIsPredicting(false);

    setQuizState((prev) => ({
      ...prev,
      inProgress: false,
      score,
    }));

    const adaptationRecord = {
      lessonTitle: selectedLesson.title,
      timestamp: new Date().toLocaleString(),
      predictedLoad: result.predictedLoad,
      score,
      ...payload.interactionMetrics,
      activity: result.recommendedActivity,
    };

    setAdaptiveRecommendation(result);
    setAdaptationHistory((prev) => [adaptationRecord, ...prev]);
  };

  const renderQuizPanel = () => {
    if (!selectedLesson) {
      return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <p className="text-gray-600 text-sm">
            Select a lesson (e.g., 'Fractions & Decimals') to launch a post-lesson quiz and adaptive
            activity analysis.
          </p>
        </div>
      );
    }

    const questions = getCurrentQuestions();
    const currentQuestion = questions[quizState.currentQuestionIndex];

    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4 border-2 border-blue-200">
        <div className="flex items-center justify-between flex-wrap">
          <div>
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
              Adaptive Quiz Module
            </p>
            <h2 className="text-xl font-bold text-gray-800 mt-1">
              {selectedLesson.title}
            </h2>
          </div>
          <div className="text-right text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
            <p>
              Attempts:{" "}
              <span className="font-bold text-blue-600">{quizState.attempts}</span>
            </p>
            <p>
              Mistakes:{" "}
              <span className="font-bold text-red-600">
                {quizState.mistakes}
              </span>
            </p>
          </div>
        </div>

        {!quizState.inProgress && quizState.score == null && (
          <button
            type="button"
            onClick={() => startQuizForLesson(selectedLesson)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl text-md font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
          >
            <PlayCircle className="w-5 h-5" />
            Start Adaptive Quiz
          </button>
        )}

        {quizState.inProgress && currentQuestion && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">
                Question {quizState.currentQuestionIndex + 1} of{" "}
                {questions.length}
              </p>
              <p className="text-xl font-bold text-gray-900 bg-gray-50 p-3 rounded-lg border-l-4 border-purple-500">
                {currentQuestion.text}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => answerQuestion(index)}
                  className="text-left border-2 border-gray-300 rounded-xl px-5 py-4 text-sm font-medium text-gray-800 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all transform hover:scale-[1.02] shadow-sm"
                >
                  {option}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              *Metrics: We track taps, retries, mistakes, and timing to estimate your
              cognitive load without intrusive sensors.
            </p>

            {allQuestionsAnswered() && (
              <button
                type="button"
                onClick={submitQuizForAdaptation}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-xl text-md font-bold hover:from-green-600 hover:to-teal-600 transition-all shadow-lg mt-3"
              >
                <CheckCircle className="w-5 h-5" />
                Submit quiz &amp; Get Adaptation
              </button>
            )}
          </div>
        )}

        {!quizState.inProgress &&
          quizState.score != null &&
          adaptiveRecommendation && (
            <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Quiz score</p>
                  <p className="text-3xl font-bold text-green-600">
                    {quizState.score}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Predicted Cognitive Load
                  </p>
                  <p className={`text-xl font-bold capitalize ${
                        adaptiveRecommendation.predictedLoad === 'high' ? 'text-red-600' : 
                        adaptiveRecommendation.predictedLoad === 'low' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                    {adaptiveRecommendation.predictedLoad} Load
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400 rounded-lg p-4 flex gap-3">
                <BarChart3 className="w-7 h-7 text-purple-600 mt-1" />
                <div>
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                    Recommended activity –{" "}
                    {adaptiveRecommendation.recommendedActivity.difficulty}
                  </p>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    {adaptiveRecommendation.recommendedActivity.label}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {adaptiveRecommendation.recommendedActivity.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-xl text-md font-bold hover:from-pink-600 hover:to-red-600 transition-all shadow-md"
              >
                <PlayCircle className="w-5 h-5" />
                Start Recommended Practice
              </button>
            </div>
          )}

        {isPredicting && (
          <div className="flex items-center gap-2 text-blue-600 mt-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm font-medium">
                Analyzing data and predicting cognitive load...
              </p>
            </div>
        )}
      </div>
    );
  };

  const renderDashboard = () => {
    return (
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Avg Cognitive Load</p>
                <p className="text-4xl font-extrabold mt-1">
                  {cognitiveStats.avgLoad}
                </p>
              </div>
              <Brain className="w-10 h-10 text-blue-300 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white shadow-xl hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Engagement Rate</p>
                <p className="text-4xl font-extrabold mt-1">
                  {cognitiveStats.engagement}%
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-300 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-xl hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Retention Score</p>
                <p className="text-4xl font-extrabold mt-1">
                  {cognitiveStats.retention}%
                </p>
              </div>
              <Trophy className="w-10 h-10 text-purple-300 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-6 text-white shadow-xl hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm font-medium">Activities Done</p>
                <p className="text-4xl font-extrabold mt-1">
                  {cognitiveStats.adaptiveActivities}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-orange-300 opacity-80" />
            </div>
          </div>
        </div>

        {/* Lessons, Quiz & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lessons */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-5">
              My Lessons
            </h2>
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`border-2 rounded-xl p-4 transition-all duration-300 cursor-pointer ${
                        selectedLesson?.id === lesson.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {lesson.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        lesson.cognitiveLoad === "high"
                          ? "bg-red-100 text-red-700 border border-red-300"
                          : lesson.cognitiveLoad === "medium"
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                          : "bg-green-100 text-green-700 border border-green-300"
                      }`}
                    >
                      Load: {lesson.cognitiveLoad.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${lesson.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 font-bold">
                      {lesson.progress}%
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm">
                    {lesson.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : lesson.status === "in-progress" ? (
                      <PlayCircle className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-gray-600 capitalize">
                      {lesson.status.replace("-", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz & Adaptive Activity */}
          <div className="lg:col-span-1 space-y-4">{renderQuizPanel()}</div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-5">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r-lg">
                <p className="font-bold text-purple-800">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.lesson}</p>
                {activity.score && (
                  <p className="text-sm font-bold text-green-600">
                    Score: {activity.score}%
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLessons = () => {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 All Courseware</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    lesson.status === "completed"
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : lesson.status === "in-progress"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300"
                  }`}
                >
                  {lesson.status === "completed"
                    ? "COMPLETED"
                    : lesson.status === "in-progress"
                    ? "IN PROGRESS"
                    : "NOT STARTED"}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 text-lg mb-2">{lesson.title}</h3>

              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-bold text-blue-600">
                    {lesson.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-colors shadow-md mt-3">
                {lesson.status === "completed"
                  ? "Review Lesson 🔄"
                  : lesson.status === "in-progress"
                  ? "Continue Learning 🚀"
                  : "Start Lesson 🎯"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const highCount = adaptationHistory.filter(
      (a) => a.predictedLoad === "high"
    ).length;
    const mediumCount = adaptationHistory.filter(
      (a) => a.predictedLoad === "medium"
    ).length;
    const lowCount = adaptationHistory.filter(
      (a) => a.predictedLoad === "low"
    ).length;
    const total = adaptationHistory.length || 1;

    const highPct = Math.round((highCount / total) * 100);
    const mediumPct = Math.round((mediumCount / total) * 100);
    const lowPct = Math.round((lowCount / total) * 100);

    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-600 w-6 h-6" /> Cognitive Learning Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-gray-600 mb-2 font-medium">Adaptive Sessions</p>
              <p className="text-5xl font-extrabold text-blue-600">
                {adaptationHistory.length}
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
              <p className="text-gray-600 mb-2 font-medium">Last Predicted Load</p>
              <p className="text-3xl font-bold text-green-600 capitalize">
                {adaptationHistory[0]?.predictedLoad ?? "—"}
              </p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-gray-600 mb-2 font-medium">Last Quiz Score</p>
              <p className="text-5xl font-extrabold text-purple-600">
                {adaptationHistory[0]?.score != null
                  ? `${adaptationHistory[0].score}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-5">
            Cognitive Load Distribution (Analyzed by system)
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-gray-700">
                  Low Load (Optimal)
                </span>
                <span className="text-sm font-bold text-green-600">
                  {lowPct}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                  style={{ width: `${lowPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-gray-700">
                  Medium Load (Normal)
                </span>
                <span className="text-sm font-bold text-yellow-600">
                  {mediumPct}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full"
                  style={{ width: `${mediumPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-gray-700">
                  High Load (Overloaded)
                </span>
                <span className="text-sm font-bold text-red-600">
                  {highPct}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full"
                  style={{ width: `${highPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-5">
            Adaptation History (server-side decisions)
          </h3>
          {adaptationHistory.length === 0 ? (
            <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              Complete a quiz to see how the system predicts cognitive load and
              adapts practice activities in real time.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {adaptationHistory.map((item) => (
                <div
                  key={`${item.lessonTitle}-${item.timestamp}`}
                  className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4 flex justify-between items-start text-sm"
                >
                  <div>
                    <p className="font-bold text-blue-800 text-base">
                      {item.lessonTitle}
                    </p>
                    <p className="text-xs text-gray-500">{item.timestamp}</p>
                    <p className="text-xs text-gray-700 mt-2">
                      Score:{" "}
                      <span className="font-bold text-green-600">{item.score}%</span> ·
                      Attempts:{" "}
                      <span className="font-bold">{item.attempts}</span> ·
                      Mistakes:{" "}
                      <span className="font-bold text-red-600">
                        {item.mistakes}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Time:{" "}
                      <span className="font-bold">
                        {Math.round(item.totalTimeMs / 1000)}s
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Predicted load</p>
                    <p className={`text-sm font-bold capitalize ${
                            item.predictedLoad === 'high' ? 'text-red-600' : 
                            item.predictedLoad === 'low' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                      {item.predictedLoad} load
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Recommended Activity</p>
                    <p className="text-xs font-bold text-gray-800">
                      {item.activity.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-9 h-9 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Adaptive Learning Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors shadow-sm">
                <Settings className="w-6 h-6 text-gray-600" />
              </button>
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors shadow-sm">
                <User className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-2 border-b-4 font-bold transition-colors ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab("lessons")}
              className={`py-4 px-2 border-b-4 font-bold transition-colors ${
                activeTab === "lessons"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Lessons
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-2 border-b-4 font-bold transition-colors ${
                activeTab === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "lessons" && renderLessons()}
        {activeTab === "analytics" && renderAnalytics()}
      </main>
    </div>
  );
}