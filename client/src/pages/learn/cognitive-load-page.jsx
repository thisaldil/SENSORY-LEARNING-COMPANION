import { useState } from 'react'
import { toast } from 'sonner'
import { postCalibration, postPredict } from '@/api/cognitive'
import { formatAuthError } from '@/api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const defaultPredict = JSON.stringify(
  {
    total_time_seconds: 120,
    total_questions: 4,
    question_interactions: [],
    back_navigations: 0,
    forward_navigations: 1,
    answer_changes: 1,
    correct_answers: 3,
    incorrect_answers: 1,
  },
  null,
  2,
)

const defaultCalibration = JSON.stringify(
  {
    total_time_seconds: 300,
    total_questions: 9,
    question_interactions: [],
    back_navigations: 0,
    forward_navigations: 2,
    answer_changes: 0,
  },
  null,
  2,
)

export function CognitiveLoadPage() {
  const [predictJson, setPredictJson] = useState(defaultPredict)
  const [calibJson, setCalibJson] = useState(defaultCalibration)
  const [predOut, setPredOut] = useState(null)
  const [calOut, setCalOut] = useState(null)
  const [busy, setBusy] = useState(false)

  async function runPredict() {
    setBusy(true)
    try {
      const payload = JSON.parse(predictJson)
      const res = await postPredict(payload)
      setPredOut(res)
      toast.success('Prediction complete')
    } catch (e) {
      toast.error(formatAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  async function runCalibration() {
    setBusy(true)
    try {
      const payload = JSON.parse(calibJson)
      const res = await postCalibration(payload)
      setCalOut(res)
      toast.success('Calibration submitted')
    } catch (e) {
      toast.error(formatAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cognitive load</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          POST /api/calibration establishes baseline; POST /api/v1/predict scores micro‑activities. Payloads are JSON — edit to match your telemetry.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Predict</CardTitle>
            <CardDescription>/api/v1/predict</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="pred-json">JSON body</Label>
            <textarea
              id="pred-json"
              className="min-h-[200px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              value={predictJson}
              onChange={(e) => setPredictJson(e.target.value)}
            />
            <Button type="button" disabled={busy} onClick={runPredict}>
              Run predictor
            </Button>
            {predOut && (
              <pre className="max-h-48 overflow-auto rounded-[10px] bg-[var(--surface-subtle)] p-3 text-xs">
                {JSON.stringify(predOut, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calibration</CardTitle>
            <CardDescription>/api/calibration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="cal-json">JSON body</Label>
            <textarea
              id="cal-json"
              className="min-h-[200px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              value={calibJson}
              onChange={(e) => setCalibJson(e.target.value)}
            />
            <Button type="button" variant="secondary" disabled={busy} onClick={runCalibration}>
              Submit calibration
            </Button>
            {calOut && (
              <pre className="max-h-48 overflow-auto rounded-[10px] bg-[var(--surface-subtle)] p-3 text-xs">
                {JSON.stringify(calOut, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
