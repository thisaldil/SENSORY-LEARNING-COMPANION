import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { loginSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const { login, isAuthenticated, bootstrapping } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/'

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (!bootstrapping && isAuthenticated) {
    const home =
      from === '/' || from === '/login' || from === '/register' ? '/app' : from
    return <Navigate to={home} replace />
  }

  async function onSubmit(values) {
    try {
      await login(values.email, values.password)
      toast.success('Signed in')
      navigate(
        from === '/' || from === '/login' || from === '/register' ? '/app' : from,
        { replace: true },
      )
    } catch (e) {
      toast.error(e?.message ?? 'Login failed')
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--background)] px-4 py-12">
      <Card className="w-full max-w-md shadow-[var(--shadow-modal)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to EduSense. Demo: include “admin”, “lecturer”, or “patel” in email for mock roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-[var(--destructive)]">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-[var(--destructive)]">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              <Link
                to="/forgot-password"
                className="font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[6px]"
              >
                Forgot password?
              </Link>
            </p>
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              New to EduSense?{' '}
              <Link
                to="/register"
                className="font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[6px]"
              >
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
