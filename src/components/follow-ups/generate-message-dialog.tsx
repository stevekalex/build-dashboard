'use client'

import { useState } from 'react'
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { generateFollowUpMessage } from '@/app/actions/follow-ups'

type Phase = 'idle' | 'generating' | 'ready' | 'sending'

interface GenerateMessageDialogProps {
  jobId: string
  stage: string
  onSent: () => void
  onMarkSent: () => Promise<void>
}

export function GenerateMessageDialog({
  jobId,
  stage,
  onSent,
  onMarkSent,
}: GenerateMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setPhase('generating')
    setError(null)

    const result = await generateFollowUpMessage(jobId, stage)

    if (result.success && result.message) {
      setMessage(result.message)
      setPhase('ready')
    } else {
      setError(result.error || 'Failed to generate message')
      setPhase('idle')
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleMarkSent() {
    setPhase('sending')
    onSent() // optimistic dismiss
    await onMarkSent()
    setOpen(false)
    resetState()
  }

  function resetState() {
    setPhase('idle')
    setMessage('')
    setCopied(false)
    setError(null)
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) resetState()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px]">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Generate Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Generate Follow-Up Message</DialogTitle>
          <DialogDescription>
            AI-powered follow-up message tailored to this job and stage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {phase === 'idle' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Generate an AI-powered follow-up message tailored to this job and stage.
              </p>
              <Button onClick={handleGenerate} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Message
              </Button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}

          {phase === 'generating' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Generating message...</span>
            </div>
          )}

          {(phase === 'ready' || phase === 'sending') && (
            <div className="space-y-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="text-sm"
                aria-label="Generated follow-up message"
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleMarkSent}
                  disabled={phase === 'sending'}
                  className="ml-auto"
                >
                  {phase === 'sending' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Mark Sent
                    </>
                  )}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleGenerate} className="w-full">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
