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
}

export function LogResponseDialog({ jobId, jobTitle }: LogResponseDialogProps) {
  const [open, setOpen] = useState(false)
  const [responseType, setResponseType] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!responseType) return
    setLoading(true)
    try {
      await logResponse(jobId, responseType, notes || undefined)
      setOpen(false)
      setResponseType('')
      setNotes('')
    } catch (error) {
      console.error('Failed to log response:', error)
    } finally {
      setLoading(false)
    }
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
