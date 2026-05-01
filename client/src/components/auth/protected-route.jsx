import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { ROLES } from '@/lib/constants'

export function ProtectedRoute({ roles }) {
  const { user, bootstrapping, isAuthenticated } = useAuth()
  const location = useLocation()

  if (bootstrapping) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--background)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export function RoleHomeRedirect() {
  const { user, bootstrapping, isAuthenticated } = useAuth()

  if (bootstrapping) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--background)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user.role === ROLES.ADMIN) return <Navigate to="/admin/users" replace />
  if (user.role === ROLES.LECTURER)
    return <Navigate to="/lecturer/dashboard" replace />
  return <Navigate to="/student/dashboard" replace />
}
