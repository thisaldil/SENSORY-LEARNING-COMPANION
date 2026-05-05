import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export function AdminSettingsPage() {
  function save(e) {
    e.preventDefault()
    toast.success('Settings saved locally — map to admin config API.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Stub panel for feature flags, retention windows, and integration keys.
        </p>
      </div>

      <form className="space-y-6" onSubmit={save}>
        <Card>
          <CardHeader>
            <CardTitle>API integration</CardTitle>
            <CardDescription>
              Point SPA to backend with `VITE_API_URL`; refresh cookie requires aligned CORS + credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="predict-url">Cognitive predict path</Label>
              <Input id="predict-url" defaultValue="/api/v1/predict" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transmute-url">Transmute path</Label>
              <Input id="transmute-url" defaultValue="/api/v1/transmute" readOnly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telemetry</CardTitle>
            <CardDescription>Optional hooks for Sentry DSN + metrics exporter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sentry">Sentry DSN</Label>
              <Input id="sentry" placeholder="https://…@sentry.io/…" />
            </div>
            <Separator />
            <Button type="submit">Save configuration</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
