'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { markContractSigned } from '@/app/actions/inbox'
import { markLost } from '@/app/actions/closing'

interface CloseDealDropdownProps {
  jobId: string
  jobTitle: string
  onAction?: () => void
}

export function CloseDealDropdown({ jobId, jobTitle, onAction }: CloseDealDropdownProps) {
  const [wonOpen, setWonOpen] = useState(false)
  const [lostOpen, setLostOpen] = useState(false)
  const [dealValue, setDealValue] = useState('')
  const [lostReason, setLostReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleWon() {
    const value = parseFloat(dealValue)
    if (isNaN(value) || value <= 0) return
    setLoading(true)
    onAction?.()
    const result = await markContractSigned(jobId, value)
    if (result.success) {
      setWonOpen(false)
      setDealValue('')
    } else {
      console.error('Failed to close deal as won:', result.error)
    }
    setLoading(false)
  }

  async function handleLost() {
    if (!lostReason.trim()) return
    setLoading(true)
    onAction?.()
    const result = await markLost(jobId, lostReason.trim())
    if (result.success) {
      setLostOpen(false)
      setLostReason('')
    } else {
      console.error('Failed to close deal as lost:', result.error)
    }
    setLoading(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-h-[44px]">
            Close Deal
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setWonOpen(true)}>
            Deal Won
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLostOpen(true)} className="text-red-600">
            Deal Lost
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Deal Won Dialog */}
      <Dialog open={wonOpen} onOpenChange={setWonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close as Won</DialogTitle>
            <DialogDescription>
              Record the deal value for &ldquo;{jobTitle}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deal-value-won">Deal Value ($)</Label>
              <Input
                id="deal-value-won"
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
              onClick={handleWon}
              disabled={!dealValue || parseFloat(dealValue) <= 0 || loading}
            >
              {loading ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Lost Dialog */}
      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close as Lost</DialogTitle>
            <DialogDescription>
              Close &ldquo;{jobTitle}&rdquo; as a lost deal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lost-reason">Reason</Label>
              <Textarea
                id="lost-reason"
                placeholder="Why was this deal lost?"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleLost}
              disabled={!lostReason.trim() || loading}
            >
              {loading ? 'Saving...' : 'Mark Lost'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
