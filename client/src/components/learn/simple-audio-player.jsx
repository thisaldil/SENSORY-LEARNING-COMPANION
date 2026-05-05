import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function SimpleAudioPlayer({ src, label = 'Narration' }) {
  useEffect(() => {
    return () => {
      if (src?.startsWith?.('blob:')) URL.revokeObjectURL(src)
    }
  }, [src])

  if (!src) {
    return (
      <div className="rounded-[12px] border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
        No audio URL yet. Run TTS synthesis when your backend exposes MP3 bytes.
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
      <audio controls className="w-full" src={src} />
      <Button type="button" variant="secondary" size="sm" asChild>
        <a href={src} download="edusense-narration.mp3">
          Download
        </a>
      </Button>
    </div>
  )
}
