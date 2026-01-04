import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Eye,
  Hand,
  Headphones,
  BookOpen,
  Sparkles,
  Zap,
  ArrowRight,
  Download,
  TrendingUp,
  Award,
  Smartphone,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "Smart Scene Generator",
      description:
        "Transform textbook images or text into interactive scene graphs and narration scripts. Our AI-powered generator extracts key concepts and creates visual learning maps.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Eye,
      title: "Visual Learning",
      description:
        "Engage with interactive scene graphs that visualize relationships between concepts. See complex ideas come to life through dynamic visual representations.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Headphones,
      title: "Audio Narration",
      description:
        "Listen to carefully crafted narration scripts that explain concepts clearly. Audio learning enhances understanding and retention of complex topics.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Hand,
      title: "Haptic Experiences",
      description:
        "Experience learning through touch. Haptic feedback helps understand physical properties and processes through tactile sensations.",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Download,
      title: "Offline Mode",
      description:
        "Access your lessons anywhere, anytime. Save lessons locally and continue learning even without an internet connection.",
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description:
        "Monitor your learning journey with detailed progress tracking. Track completed lessons, earn points, and see your growth over time.",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  const stats = [
    { icon: BookOpen, label: "Science Lessons", value: "50+" },
    { icon: Award, label: "Learning Modules", value: "12" },
    { icon: Smartphone, label: "Multi-Modal", value: "3" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-20 pb-16 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto text-center">
            {/* Logo/Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-full p-6 inline-block">
                  <Brain className="w-16 h-16 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                Sensory Learning
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-green-600 bg-clip-text text-transparent">
                Companion
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium"
            >
              Transform your science learning experience with multi-sensory
              education. See, hear, and feel concepts come to life!
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-shadow"
              >
                <Sparkles className="w-6 h-6" />
                Get Started
                <ArrowRight className="w-6 h-6" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="flex items-center gap-3 bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl border-2 border-purple-200 transition-shadow"
              >
                <BookOpen className="w-6 h-6" />
                Learn More
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100 text-center"
              >
                <div className="inline-block bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-4 mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Discover how Sensory Learning Companion revolutionizes science
              education
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-purple-200 transition-all"
              >
                <div
                  className={`inline-block ${feature.bgColor} rounded-full p-4 mb-4`}
                >
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Upload or Input",
                  description:
                    "Upload a textbook image or enter text content. Our AI analyzes the content to extract key concepts.",
                  icon: BookOpen,
                },
                {
                  step: "02",
                  title: "Generate Scene Graph",
                  description:
                    "Watch as concepts are transformed into interactive scene graphs with relationships and connections visualized.",
                  icon: Zap,
                },
                {
                  step: "03",
                  title: "Learn Multi-Sensory",
                  description:
                    "Engage with visual graphs, audio narration, and haptic feedback to understand concepts thoroughly.",
                  icon: Award,
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center"
                >
                  <div className="text-6xl font-bold opacity-30 mb-4">
                    {step.step}
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-4 inline-block mb-4">
                    <step.icon className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-white opacity-90 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center"
        >
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-purple-200">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-16 h-16 text-purple-600" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ready to Start Learning?
              </span>
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Join thousands of students discovering science through
              multi-sensory learning experiences.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")}
              className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-shadow mx-auto"
            >
              <Brain className="w-6 h-6" />
              Begin Your Journey
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-6 h-6" />
            <span className="text-xl font-bold">
              Sensory Learning Companion
            </span>
          </div>
          <p className="text-white opacity-90">
            Transforming Science Education Through Multi-Sensory Learning
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
