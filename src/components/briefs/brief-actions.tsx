'use client'

import { Brief } from '@/types/brief'
import { ApproveDialog } from './approve-dialog'
import { RejectDialog } from './reject-dialog'
import { approveBrief, rejectBriefAction } from '@/app/actions'
import { useRouter } from 'next/navigation'

interface BriefActionsProps {
  brief: Brief
}

export function BriefActions({ brief }: BriefActionsProps) {
  const router = useRouter()

  async function handleApprove(briefId: string) {
    const result = await approveBrief(briefId)
    if (result.success) {
      router.push('/')
      router.refresh()
    } else {
      alert(`Failed to approve: ${result.error}`)
    }
  }

  async function handleReject(briefId: string, reason: string) {
    const result = await rejectBriefAction(briefId, reason)
    if (result.success) {
      router.push('/')
      router.refresh()
    } else {
      alert(`Failed to reject: ${result.error}`)
    }
  }

  return (
    <div className="flex gap-3 w-full md:w-auto">
      {/* Touch-optimized buttons - minimum 44x44px */}
      <div className="flex-1 md:flex-initial">
        <ApproveDialog brief={brief} onApprove={handleApprove} />
      </div>
      <div className="flex-1 md:flex-initial">
        <RejectDialog brief={brief} onReject={handleReject} />
      </div>
    </div>
  )
}
