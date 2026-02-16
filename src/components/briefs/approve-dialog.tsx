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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, CheckCircle, CheckCircle2 } from 'lucide-react'

interface ApproveDialogProps {
  brief: Brief
  onApprove: (briefId: string, notes: string) => Promise<void>
}

interface ParsedBrief {
  done_criteria?: string[]
  [key: string]: any
}

export function ApproveDialog({ brief, onApprove }: ApproveDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState('')

  const parsedBrief = parseBriefData(brief.brief)

  async function handleConfirm() {
    setIsLoading(true)
    try {
      await onApprove(brief.id, notes)
      setOpen(false)
      setNotes('')
    } catch (error) {
      console.error('Failed to approve brief:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full md:w-auto min-h-[44px]">
          <CheckCircle className="w-4 h-4 mr-2" />
          Start Build
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">Start Build</DialogTitle>
          <DialogDescription className="text-base">
            {brief.title}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* 1. Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 text-sm">
                  This will start a ~45 minute build
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  The build will consume resources and cannot be easily stopped once started.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Description */}
          {brief.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-200">
                {brief.description}
              </p>
            </div>
          )}

          {/* 3. Key Tasks (Done Criteria) */}
          {parsedBrief.done_criteria && parsedBrief.done_criteria.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Key Tasks ({parsedBrief.done_criteria.length})
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <ul className="space-y-2">
                  {parsedBrief.done_criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-900 leading-relaxed">{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 4. Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="approve-notes" className="text-sm font-semibold text-gray-700">
              Notes (optional)
            </Label>
            <Textarea
              id="approve-notes"
              placeholder="Add any notes about this approval..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* 5. Confirm/Cancel Buttons */}
        <DialogFooter className="flex-shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="flex-1 md:flex-initial"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 flex-1 md:flex-initial"
          >
            {isLoading ? 'Starting Build...' : 'Confirm Build'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function parseBriefData(briefString: string): ParsedBrief {
  try {
    return JSON.parse(briefString)
  } catch {
    return {}
  }
}
