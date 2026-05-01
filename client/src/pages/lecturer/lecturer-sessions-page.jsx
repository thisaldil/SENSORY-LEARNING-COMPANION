import { useState } from 'react'
import { Radio, Wifi } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function LecturerSessionsPage() {
  const [live, setLive] = useState(false)

  function startSession() {
    setLive(true)
    toast.success('Session marked live (stub — connect WebSocket gateway).')
  }

  function endSession() {
    setLive(false)
    toast.message('Session ended (stub).')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Live panel placeholder for classroom telemetry (optional WebSocket channel).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-[var(--border)] shadow-[var(--shadow-card)]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Radio className={live ? 'text-[var(--destructive)] animate-pulse' : ''} />
                Live session control
              </CardTitle>
              <CardDescription>
                POST `/sessions/start` style actions map here once exposed in OpenAPI.
              </CardDescription>
            </div>
            <Badge variant={live ? 'default' : 'secondary'}>
              {live ? 'Live' : 'Idle'}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button type="button" onClick={startSession} disabled={live}>
              Start session
            </Button>
            <Button type="button" variant="secondary" onClick={endSession} disabled={!live}>
              End session
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.message('Emit learner event — POST /sessions/:id/event (planned).')
              }
            >
              Send heartbeat event
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wifi className="h-5 w-5 text-[var(--info)]" />
              Transport
            </CardTitle>
            <CardDescription>
              Prefer secure WebSocket with JWT subprotocol or cookie-backed upgrade.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted-foreground)] space-y-2">
            <p>
              Client keeps access token in sessionStorage; refresh cookie rides with fetch + WS
              handshake policies must align with your API gateway.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
