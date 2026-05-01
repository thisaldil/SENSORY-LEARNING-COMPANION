import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { analyzeNoteImage } from '@/api/vision-notes'
import { fetchVoiceCloneHealth, voiceCloneSynthesize } from '@/api/tts-voice'
import { formatAuthError } from '@/api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimpleAudioPlayer } from '@/components/learn/simple-audio-player'

export function VisionNotesPage() {
  const [ocrText, setOcrText] = useState('')
  const [health, setHealth] = useState(null)
  const [cloneText, setCloneText] = useState('Hello from EduSense voice clone stub.')
  const [wav, setWav] = useState(null)
  const [cloneUrl, setCloneUrl] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    return () => {
      if (cloneUrl?.startsWith?.('blob:')) URL.revokeObjectURL(cloneUrl)
    }
  }, [cloneUrl])

  async function onAnalyze(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const res = await analyzeNoteImage(file)
      setOcrText(res.text ?? JSON.stringify(res))
      toast.success('Vision OCR complete')
    } catch (err) {
      toast.error(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  async function checkVoiceHealth() {
    setBusy(true)
    try {
      const h = await fetchVoiceCloneHealth()
      setHealth(h)
      toast.success('Voice service reachable')
    } catch (err) {
      toast.error(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  async function runClone() {
    if (!wav) {
      toast.error('Choose a WAV reference clip.')
      return
    }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('text', cloneText)
      fd.append('speaker_wav', wav)
      fd.append('language', 'en')
      const url = await voiceCloneSynthesize(fd)
      setCloneUrl((prev) => {
        if (prev?.startsWith?.('blob:')) URL.revokeObjectURL(prev)
        return url
      })
      toast.success('Cloned audio ready')
    } catch (err) {
      toast.error(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vision & voice lab</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          POST /api/vision/notes/analyze (multipart) · GET /tts/health · POST /tts/voice-clone (multipart).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vision notes</CardTitle>
            <CardDescription>Upload PNG/JPEG notes for OCR.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="file" accept="image/*" disabled={busy} onChange={onAnalyze} />
            {ocrText && (
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-[10px] bg-[var(--surface-subtle)] p-3 text-sm">
                {ocrText}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice clone</CardTitle>
            <CardDescription>XTTS endpoint returns WAV bytes as a blob URL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={checkVoiceHealth}>
              GET /tts/health
            </Button>
            {health && (
              <pre className="text-xs text-[var(--muted-foreground)]">
                {JSON.stringify(health)}
              </pre>
            )}
            <div className="space-y-2">
              <Label htmlFor="clone-txt">Text</Label>
              <Input
                id="clone-txt"
                value={cloneText}
                onChange={(e) => setCloneText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wav">Reference WAV</Label>
              <Input
                id="wav"
                type="file"
                accept=".wav,audio/wav"
                onChange={(e) => setWav(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="button" disabled={busy} onClick={runClone}>
              POST /tts/voice-clone
            </Button>
            <SimpleAudioPlayer src={cloneUrl} label="Cloned voice output" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
