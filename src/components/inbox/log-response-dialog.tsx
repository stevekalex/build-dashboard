'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { logResponse } from '@/app/actions/inbox'
import { RESPONSE_TYPES } from '@/lib/airtable-fields'

interface LogResponseDialogProps {
  jobId: string
  jobTitle: string
  onAction?: () => void
}

export function LogResponseDialog({ jobId, jobTitle, onAction }: LogResponseDialogProps) {
  const [open, setOpen] = useState(false)
  const [responseType, setResponseType] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!responseType) return
    setLoading(true)
    setError(null)
    const result = await logResponse(jobId, responseType, notes || undefined)
    if (result.success) {
      setOpen(false)
      setResponseType('')
      setNotes('')
      onAction?.()
    } else {
      setError(result.error || 'Failed to log response')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Log Response
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Response</DialogTitle>
          <DialogDescription>
            Record the client's response for "{jobTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-3">
            <Label>Response Type</Label>
            <RadioGroup value={responseType} onValueChange={setResponseType}>
              {RESPONSE_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`response-${type}`} />
                  <Label htmlFor={`response-${type}`} className="font-normal cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="response-notes">Notes (optional)</Label>
            <Textarea
              id="response-notes"
              placeholder="Any additional context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!responseType || loading}
          >
            {loading ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
