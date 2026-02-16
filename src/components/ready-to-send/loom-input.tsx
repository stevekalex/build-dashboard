'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { saveLoomUrl } from '@/app/actions/ready-to-send'
import { Check, Loader2, Link as LinkIcon } from 'lucide-react'

interface LoomInputProps {
  jobId: string
  existingUrl?: string
}

export function LoomInput({ jobId, existingUrl }: LoomInputProps) {
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedUrl, setSavedUrl] = useState(existingUrl)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!url.trim()) return
    setSaving(true)
    setError(null)

    const result = await saveLoomUrl(jobId, url.trim())

    if (result.success) {
      setSavedUrl(url.trim())
      setUrl('')
    } else {
      setError(result.error || 'Failed to save')
    }
    setSaving(false)
  }

  if (savedUrl) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Check className="w-4 h-4 text-green-600 shrink-0" />
        <a
          href={savedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 truncate"
        >
          {savedUrl.replace(/^https?:\/\//, '').slice(0, 40)}
          {savedUrl.replace(/^https?:\/\//, '').length > 40 ? '...' : ''}
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-xs">
        <Input
          type="url"
          placeholder="Paste Loom URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-8 text-sm pr-2"
          aria-label="Loom URL"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={saving || !url.trim()}
        className="h-8"
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5 mr-1" />
            Save
          </>
        )}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
