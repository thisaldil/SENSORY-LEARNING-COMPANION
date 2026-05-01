/** Sample data for loading demos when API is unavailable or VITE_USE_MOCK is set. */

export const mockUserStudent = {
  id: 'user-1',
  email: 'alex.student@university.edu',
  full_name: 'Alex Morgan',
  role: 'student',
}

export const mockUserLecturer = {
  id: 'user-2',
  email: 'dr.patel@university.edu',
  full_name: 'Dr. Priya Patel',
  role: 'lecturer',
}

export const mockUserAdmin = {
  id: 'user-3',
  email: 'admin@university.edu',
  full_name: 'Jordan Lee',
  role: 'admin',
}

export const mockLessons = [
  {
    id: 'les-1',
    title: 'Neuroplasticity & sensory pathways',
    description: 'Tiered multisensory outline with visual + haptic cues.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'les-2',
    title: 'Dual coding in STEM diagrams',
    description: 'Animation scripts aligned with cognitive load bands.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'les-3',
    title: 'Embodied cognition lab',
    description: 'Interactive calibration + progress checkpoints.',
    updated_at: new Date().toISOString(),
  },
]

export const mockQuizResults = [
  {
    quiz_id: 'q-101',
    score: 88,
    completed_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    quiz_id: 'q-102',
    score: 72,
    completed_at: new Date(Date.now() - 172800000).toISOString(),
  },
]

export const mockProgress = {
  lessons_completed: 7,
  quizzes_taken: 12,
  avg_quiz_score: 81,
  streak_days: 5,
  engagement_series: [
    { day: 'Mon', value: 42 },
    { day: 'Tue', value: 55 },
    { day: 'Wed', value: 48 },
    { day: 'Thu', value: 62 },
    { day: 'Fri', value: 58 },
    { day: 'Sat', value: 35 },
    { day: 'Sun', value: 44 },
  ],
}

export const mockAdminUsers = [
  {
    id: 'u1',
    email: 'alex.student@university.edu',
    name: 'Alex Morgan',
    role: 'student',
  },
  {
    id: 'u2',
    email: 'dr.patel@university.edu',
    name: 'Dr. Priya Patel',
    role: 'lecturer',
  },
  {
    id: 'u3',
    email: 'admin@university.edu',
    name: 'Jordan Lee',
    role: 'admin',
  },
]

export function delay(ms = 400) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Pipeline job terminal shape (flexible for real API). */
export const mockJobCompletedPayload = {
  status: 'completed',
  progress: 100,
  message: 'Processing finished',
}

export const mockTransmuteResponse = {
  original_complexity_score: 0.42,
  flesch_kincaid_grade: 8.2,
  dependency_distance: 0.35,
  keywords_preserved: ['neuron', 'memory', 'pathway'],
  transmuted_text:
    '• Key idea one — simplified.\n• Key idea two — concise.\n• Key idea three — actionable.',
  tier_applied: 'Tier 3',
  llm_error: null,
}

export const mockAnimationResponse = {
  script: {
    title: 'Adaptive demo',
    duration: 120000,
    scenes: [
      {
        id: 'scene-1',
        startTime: 0,
        duration: 60000,
        meta: {
          ctmlPrinciples: ['coherence'],
          salienceLevel: 'moderate',
        },
        text: 'Concept introduction with dual coding.',
        actors: [
          {
            type: 'diagram',
            x: 45,
            y: 50,
            animation: 'pulse',
            color: '#2563EB',
          },
        ],
      },
      {
        id: 'scene-2',
        startTime: 60000,
        duration: 60000,
        meta: {
          ctmlPrinciples: ['segmenting', 'signaling'],
          salienceLevel: 'rich',
        },
        text: 'Embodied cue reinforces the pathway.',
        actors: [
          {
            type: 'pathway',
            x: 55,
            y: 48,
            animation: 'wave',
            color: '#14B8A6',
          },
        ],
      },
    ],
  },
  source: 'mock',
  concept: 'demo',
}

export const mockSensoryOverlay = {
  narration_segments: [{ scene_id: 'scene-1', text: 'Listen along.', duration_ms: 4000 }],
  haptic_timeline: [{ at_ms: 0, pattern: 'light', scene_id: 'scene-1' }],
  speech_rate: 'normal',
}

export const mockGlobalActivities = [
  { id: 'ga1', title: 'Calibration handshake', type: 'calibration' },
  { id: 'ga2', title: 'Baseline reading', type: 'reading' },
  { id: 'ga3', title: 'Quick reflection', type: 'reflection' },
]

export const mockQuizTake = {
  quiz: {
    id: 'quiz-mock-1',
    lesson_id: 'les-1',
    user_id: 'user-1',
    questions: [
      {
        id: 'q1',
        type: 'mcq',
        question: 'Which principle reduces extraneous cognitive load?',
        options: ['Decorative animations', 'Chunking + signaling', 'Wall of text only'],
        correct_index: 1,
      },
      {
        id: 'q2',
        type: 'mcq',
        question: 'Dual coding pairs verbal and ___ channels.',
        options: ['olfactory', 'visual', 'thermal'],
        correct_index: 1,
      },
    ],
    created_at: new Date().toISOString(),
  },
  result: {
    id: 'res-mock-1',
    quiz_id: 'quiz-mock-1',
    user_id: 'user-1',
    score: 100,
    correct_count: 2,
    total_questions: 2,
    completed_at: new Date().toISOString(),
    cognitive_load: 'OPTIMAL',
    cognitive_load_confidence: 0.82,
  },
}
