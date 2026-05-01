import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { forgotPasswordSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordPage() {
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values) {
    await new Promise((r) => setTimeout(r, 400))
    toast.success(`If an account exists for ${values.email}, you’ll get reset instructions.`)
    form.reset()
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--background)] px-4 py-12">
      <Card className="w-full max-w-md shadow-[var(--shadow-modal)]">
        <CardHeader>
          <CardTitle className="text-2xl">Reset access</CardTitle>
          <CardDescription>
            Stub UI — wire to your backend forgot-password endpoint when available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="fp-email">Email</Label>
              <Input id="fp-email" type="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-xs text-[var(--destructive)]">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Send reset link
            </Button>
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              <Link
                to="/login"
                className="font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[6px]"
              >
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
