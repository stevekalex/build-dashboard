'use client'

import { Brief } from '@/types/brief'
import { BriefsTable } from './briefs-table'
import { BriefCardMobile } from './brief-card-mobile'
import { approveBrief, rejectBriefAction } from '@/app/actions'
import { useRouter } from 'next/navigation'

interface BriefsListResponsiveProps {
  briefs: Brief[]
}

export function BriefsListResponsive({ briefs }: BriefsListResponsiveProps) {
  const router = useRouter()

  async function handleApprove(briefId: string) {
    const result = await approveBrief(briefId)
    if (result.success) {
      router.refresh()
    } else {
      alert(`Failed to approve: ${result.error}`)
    }
  }

  async function handleReject(briefId: string, reason: string) {
    const result = await rejectBriefAction(briefId, reason)
    if (result.success) {
      router.refresh()
    } else {
      alert(`Failed to reject: ${result.error}`)
    }
  }

  if (briefs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="space-y-2">
          <p className="text-lg font-medium">No briefs pending approval</p>
          <p className="text-sm text-gray-400">New jobs will appear here when submitted</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: Card Layout */}
      <div className="md:hidden space-y-3">
        {briefs.map((brief) => (
          <BriefCardMobile
            key={brief.id}
            brief={brief}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden md:block">
        <BriefsTable briefs={briefs} />
      </div>
    </>
  )
}
