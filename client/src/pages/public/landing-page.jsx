import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function LandingPage() {
  return (
    <div className="min-h-svh bg-[var(--background)] text-[var(--foreground)]">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-6 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--primary)] text-white font-bold text-sm">
            E
          </div>
          <span className="font-semibold">EduSense</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/register">Create account</Link>
          </Button>
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-4 pb-20 pt-10 md:px-8 md:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] shadow-[var(--shadow-card)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
              Neuro-adaptive multisensory learning
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl md:leading-[1.1]">
              Calm analytics for embodied, sensory-rich education.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[var(--muted-foreground)]">
              EduSense connects lessons, quizzes, and progress with behavioral
              proxies for cognitive load—ready to pair with your FastAPI backend.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/login">
                  Enter platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/register">Create account</Link>
              </Button>
              {import.meta.env.VITE_DOCS_URL ?
                <Button asChild variant="outline" size="lg">
                  <a
                    href={import.meta.env.VITE_DOCS_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    API docs
                  </a>
                </Button>
              : null}
            </div>
          </div>
          <Card className="border-[var(--border)] shadow-[var(--shadow-card)]">
            <CardContent className="space-y-6 p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-[12px] bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                  <Brain className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">What you get</h2>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
                    <li>JWT access tokens + refresh cookie flow (wired client-side).</li>
                    <li>Student / lecturer / admin shells aligned to your research UX.</li>
                    <li>Hooks into `/api/lessons`, `/api/quizzes/results`, `/api/progress/me`.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
