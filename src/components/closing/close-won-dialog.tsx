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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { markContractSigned } from '@/app/actions/inbox'

interface CloseWonDialogProps {
  jobId: string
  jobTitle: string
}

export function CloseWonDialog({ jobId, jobTitle }: CloseWonDialogProps) {
  const [open, setOpen] = useState(false)
  const [dealValue, setDealValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const value = parseFloat(dealValue)
    if (isNaN(value) || value <= 0) return
    setLoading(true)
    try {
      await markContractSigned(jobId, value)
      setOpen(false)
      setDealValue('')
    } catch (error) {
      console.error('Failed to close deal as won:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Close Won
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close as Won</DialogTitle>
          <DialogDescription>
            Record the deal value for "{jobTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="deal-value">Deal Value ($)</Label>
            <Input
              id="deal-value"
              type="number"
              placeholder="e.g. 5000"
              min="0"
              step="0.01"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!dealValue || parseFloat(dealValue) <= 0 || loading}
          >
            {loading ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
