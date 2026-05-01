import { Navigate, Route, Routes } from 'react-router-dom'
import { ROLES } from '@/lib/constants'
import {
  ProtectedRoute,
  RoleHomeRedirect,
} from '@/components/auth/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { LandingPage } from '@/pages/public/landing-page'
import { LoginPage } from '@/pages/public/login-page'
import { RegisterPage } from '@/pages/public/register-page'
import { ForgotPasswordPage } from '@/pages/public/forgot-password-page'
import { UnauthorizedPage } from '@/pages/public/unauthorized-page'
import { StudentDashboardPage } from '@/pages/student/student-dashboard-page'
import { StudentCoursesPage } from '@/pages/student/student-courses-page'
import { StudentCourseDetailPage } from '@/pages/student/student-course-detail-page'
import { StudentReportsPage } from '@/pages/student/student-reports-page'
import { LecturerDashboardPage } from '@/pages/lecturer/lecturer-dashboard-page'
import { LecturerCoursesPage } from '@/pages/lecturer/lecturer-courses-page'
import { LecturerSessionsPage } from '@/pages/lecturer/lecturer-sessions-page'
import { LecturerAnalyticsPage } from '@/pages/lecturer/lecturer-analytics-page'
import { AdminUsersPage } from '@/pages/admin/admin-users-page'
import { AdminSettingsPage } from '@/pages/admin/admin-settings-page'
import { ProfilePage } from '@/pages/common/profile-page'
import { SettingsPage } from '@/pages/common/settings-page'
import { LearnFlowPage } from '@/pages/learn/learn-flow-page'
import { ConceptExplorePage } from '@/pages/learn/concept-explore-page'
import { LessonPlayerPage } from '@/pages/learn/lesson-player-page'
import { QuizSessionPage } from '@/pages/learn/quiz-session-page'
import { QuizzesHubPage } from '@/pages/learn/quizzes-hub-page'
import { ActivitiesHubPage } from '@/pages/learn/activities-hub-page'
import { ProgressHubPage } from '@/pages/learn/progress-hub-page'
import { CognitiveLoadPage } from '@/pages/learn/cognitive-load-page'
import { VisionNotesPage } from '@/pages/learn/vision-notes-page'
import { TestGenerationPage } from '@/pages/dev/test-generation-page'

const LEARN_ROLES = [ROLES.STUDENT, ROLES.LECTURER]

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/app" element={<RoleHomeRedirect />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.STUDENT]} />}>
        <Route element={<AppShell />}>
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/courses" element={<StudentCoursesPage />} />
          <Route path="/student/courses/:id" element={<StudentCourseDetailPage />} />
          <Route path="/student/reports" element={<StudentReportsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.LECTURER]} />}>
        <Route element={<AppShell />}>
          <Route path="/lecturer/dashboard" element={<LecturerDashboardPage />} />
          <Route path="/lecturer/courses" element={<LecturerCoursesPage />} />
          <Route path="/lecturer/courses/:id" element={<StudentCourseDetailPage />} />
          <Route path="/lecturer/sessions" element={<LecturerSessionsPage />} />
          <Route path="/lecturer/analytics" element={<LecturerAnalyticsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={LEARN_ROLES} />}>
        <Route element={<AppShell />}>
          <Route path="/learn" element={<LearnFlowPage />} />
          <Route path="/learn/concept-explore" element={<ConceptExplorePage />} />
          <Route path="/learn/player" element={<LessonPlayerPage />} />
          <Route path="/learn/quiz/:quizId" element={<QuizSessionPage />} />
          <Route path="/quizzes" element={<QuizzesHubPage />} />
          <Route path="/activities" element={<ActivitiesHubPage />} />
          <Route path="/progress" element={<ProgressHubPage />} />
          <Route path="/cognitive" element={<CognitiveLoadPage />} />
          <Route path="/vision" element={<VisionNotesPage />} />
        </Route>
      </Route>

      {import.meta.env.DEV ?
        <Route
          element={
            <ProtectedRoute roles={[ROLES.STUDENT, ROLES.LECTURER, ROLES.ADMIN]} />
          }
        >
          <Route element={<AppShell />}>
            <Route path="/dev/test-generation" element={<TestGenerationPage />} />
          </Route>
        </Route>
      : null}

      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<AppShell />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
