import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Brain,
  FlaskConical,
  LayoutDashboard,
  ListTodo,
  Radio,
  ScanLine,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Waypoints,
  HelpCircle,
  PlayCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLES } from '@/lib/constants'
import { Separator } from '@/components/ui/separator'

const learnNav = [
  { to: '/learn', label: 'Learn flow', icon: Waypoints },
  { to: '/learn/player', label: 'Lesson player', icon: PlayCircle },
  { to: '/quizzes', label: 'Quizzes', icon: HelpCircle },
  { to: '/activities', label: 'Activities', icon: ListTodo },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/cognitive', label: 'Cognitive load', icon: Brain },
  { to: '/vision', label: 'Vision notes', icon: ScanLine },
]

const devNav = import.meta.env.DEV ?
  [{ to: '/dev/test-generation', label: 'Dev: Gemini test', icon: FlaskConical }]
: []

const studentCore = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'Lessons', icon: BookOpen },
  { to: '/student/reports', label: 'Reports', icon: BarChart3 },
]

const lecturerCore = [
  { to: '/lecturer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lecturer/courses', label: 'Courses', icon: BookOpen },
  { to: '/lecturer/sessions', label: 'Sessions', icon: Radio },
  { to: '/lecturer/analytics', label: 'Analytics', icon: BarChart3 },
]

const adminLinks = [
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar({ role, onNavigate }) {
  const links = useMemo(() => {
    if (role === ROLES.ADMIN) return adminLinks
    const core = role === ROLES.LECTURER ? lecturerCore : studentCore
    return [...core.slice(0, 1), ...learnNav, ...devNav, ...core.slice(1)]
  }, [role])

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--primary)] text-white font-bold text-sm">
          E
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            EduSense
          </p>
          <p className="text-xs text-[var(--muted-foreground)] capitalize">
            {role}
          </p>
        </div>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/learn' || to === '/quizzes' || to === '/activities' || to === '/progress' || to === '/cognitive' || to === '/vision' || to === '/dev/test-generation'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                isActive
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-[12px] border border-[var(--border)] bg-[var(--surface-subtle)]/50 p-4 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
          <Shield className="h-4 w-4 text-[var(--accent)]" aria-hidden />
          Pipeline-ready UI
        </div>
        <p className="mt-2 leading-relaxed">
          Learn flow polls jobs, calls transmute/animation/sensory/quiz endpoints, and degrades gracefully when routes are stubbed.
        </p>
      </div>
    </div>
  )
}
