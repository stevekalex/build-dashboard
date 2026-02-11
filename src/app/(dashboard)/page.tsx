import { getBriefsPendingApproval } from '@/lib/airtable'
import { BriefsListResponsive } from '@/components/briefs/briefs-list-responsive'

export const revalidate = 15 // Revalidate every 15 seconds

export default async function DashboardPage() {
  const briefs = await getBriefsPendingApproval()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-3xl font-bold text-gray-900">
          Briefs Pending Approval
        </h1>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Review and approve briefs before starting builds
        </p>
      </div>

      <BriefsListResponsive briefs={briefs} />
    </div>
  )
}
