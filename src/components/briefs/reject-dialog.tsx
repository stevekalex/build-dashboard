'use client'

import { useState } from 'react'
import { Brief } from '@/types/brief'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

interface RejectDialogProps {
  brief: Brief
  onReject: (briefId: string, reason: string) => Promise<void>
}

const PREDEFINED_REASONS = [
  { value: 'scope_unclear', label: 'Scope unclear - needs more detail' },
  { value: 'not_buildable', label: 'Not buildable' },
  { value: 'too_complex', label: 'Too complex' },
  { value: 'other', label: 'Other' },
]

export function RejectDialog({ brief, onReject }: RejectDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')

  function getReason(): string {
    if (selectedReason === 'other') {
      return customReason.trim()
    }
    const reason = PREDEFINED_REASONS.find((r) => r.value === selectedReason)
    return reason?.label || ''
  }

  function isConfirmDisabled(): boolean {
    if (!selectedReason) return true
    if (selectedReason === 'other' && !customReason.trim()) return true
    return false
  }

  async function handleConfirm() {
    const reason = getReason()
    if (!reason) return

    setIsLoading(true)
    try {
      await onReject(brief.id, reason)
      setOpen(false)
      // Reset form
      setSelectedReason('')
      setCustomReason('')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    setOpen(false)
    // Reset form
    setSelectedReason('')
    setCustomReason('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full md:w-auto min-h-[44px]">
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reject Brief</DialogTitle>
          <DialogDescription>
            Select a reason for rejecting "{brief.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {PREDEFINED_REASONS.map((reason) => (
              <div key={reason.value} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.value} id={reason.value} />
                <Label htmlFor={reason.value} className="cursor-pointer font-normal">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Custom Reason</Label>
              <Textarea
                id="custom-reason"
                placeholder="Enter rejection reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled() || isLoading}
          >
            {isLoading ? 'Rejecting...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
