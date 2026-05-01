import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { registerSchema } from '@/lib/schemas'
import { formatAuthError } from '@/api/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const selectClassName = cn(
  'flex h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

export function RegisterPage() {
  const { register: signUp, isAuthenticated, bootstrapping } = useAuth()
  const navigate = useNavigate()

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
    },
  })

  if (!bootstrapping && isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  async function onSubmit(values) {
    try {
      await signUp(values)
      toast.success('Account created — you are signed in.')
      navigate('/app', { replace: true })
    } catch (e) {
      toast.error(formatAuthError(e))
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--background)] px-4 py-12">
      <Card className="w-full max-w-lg shadow-[var(--shadow-modal)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Matches your API{' '}
            <span className="font-medium text-[var(--foreground)]">UserSignup</span>{' '}
            fields. After registration we sign you in automatically (login returns your JWT).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" autoComplete="given-name" {...form.register('first_name')} />
                {form.formState.errors.first_name && (
                  <p className="text-xs text-[var(--destructive)]">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" autoComplete="family-name" {...form.register('last_name')} />
                {form.formState.errors.last_name && (
                  <p className="text-xs text-[var(--destructive)]">
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                {...form.register('username')}
              />
              {form.formState.errors.username && (
                <p className="text-xs text-[var(--destructive)]">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input id="date_of_birth" type="date" {...form.register('date_of_birth')} />
              {form.formState.errors.date_of_birth && (
                <p className="text-xs text-[var(--destructive)]">
                  {form.formState.errors.date_of_birth.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender (optional)</Label>
              <select id="gender" className={selectClassName} {...form.register('gender')}>
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-[var(--destructive)]">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-[var(--destructive)]">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>

            <p className="text-center text-sm text-[var(--muted-foreground)]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[6px]"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
