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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { markLost } from '@/app/actions/closing'

interface MarkLostDialogProps {
  jobId: string
  jobTitle: string
  onAction?: () => void
}

export function MarkLostDialog({ jobId, jobTitle, onAction }: MarkLostDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!reason.trim()) return
    setLoading(true)
    try {
      onAction?.()
      await markLost(jobId, reason.trim())
      setOpen(false)
      setReason('')
    } catch (error) {
      console.error('Failed to mark as lost:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-500">
          Mark Lost
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Lost</DialogTitle>
          <DialogDescription>
            Close "{jobTitle}" as a lost deal
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="lost-reason">Reason</Label>
            <Textarea
              id="lost-reason"
              placeholder="Why was this deal lost?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || loading}
          >
            {loading ? 'Saving...' : 'Mark Lost'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
