import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/contexts/theme-context'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Appearance preference persists to localStorage (`edusense-theme`).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Matches top-bar toggle; WCAG-focused tokens in `index.css`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={theme === 'light' ? 'default' : 'secondary'}
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button
                type="button"
                variant={theme === 'dark' ? 'default' : 'secondary'}
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
            </div>
          </div>
          <Separator />
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Refresh tokens should remain httpOnly; access JWT stays in sessionStorage for SPA fetch defaults.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
