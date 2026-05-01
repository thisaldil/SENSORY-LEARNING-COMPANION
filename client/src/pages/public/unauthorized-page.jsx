import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[var(--background)] px-4 text-center">
      <ShieldAlert className="h-12 w-12 text-[var(--warning)]" aria-hidden />
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">Access denied</h1>
      <p className="max-w-md text-[var(--muted-foreground)]">
        Your role does not include this area. Switch accounts or return to your dashboard.
      </p>
      <Button asChild>
        <Link to="/app">Go to home</Link>
      </Button>
    </div>
  )
}
