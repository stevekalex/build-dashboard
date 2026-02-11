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
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface ApproveDialogProps {
  brief: Brief
  onApprove: (briefId: string) => Promise<void>
}

export function ApproveDialog({ brief, onApprove }: ApproveDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleConfirm() {
    setIsLoading(true)
    try {
      await onApprove(brief.id)
      setOpen(false)
    } catch (error) {
      console.error('Failed to approve brief:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="w-4 h-4 mr-2" />
          Start Build
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Approve Build: {brief.title}</DialogTitle>
          <DialogDescription>
            Are you sure you want to start building this prototype?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  This will start a ~45 minute build
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  The build will consume resources and cannot be easily stopped once started.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Template</p>
              <Badge variant="secondary" className="mt-1">
                {formatTemplate(brief.template)}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Routes</p>
              <p className="text-sm text-gray-900">
                {brief.routes?.length || 0} {brief.routes?.length === 1 ? 'route' : 'routes'}
              </p>
              {brief.routes && brief.routes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {brief.routes.slice(0, 5).map((route: any, idx: number) => (
                    <li key={idx} className="text-sm text-gray-600">
                      • {route.path} - {route.name}
                    </li>
                  ))}
                  {brief.routes.length > 5 && (
                    <li className="text-sm text-gray-500 italic">
                      ... and {brief.routes.length - 5} more
                    </li>
                  )}
                </ul>
              )}
            </div>

            {brief.description && (
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-sm text-gray-700 mt-1">{brief.description}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Approving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatTemplate(template: string): string {
  const templateMap: Record<string, string> = {
    dashboard: 'Dashboard',
    web_app: 'Web App',
    unknown: 'Unknown',
  }
  return templateMap[template] || template
}
