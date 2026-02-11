import { getBriefsPendingApproval, getAllBuilds } from '@/lib/airtable'
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs'

export const revalidate = 15 // Revalidate every 15 seconds

export default async function DashboardPage() {
  // Fetch both briefs and builds in parallel
  const [briefs, builds] = await Promise.all([
    getBriefsPendingApproval(),
    getAllBuilds(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-3xl font-bold text-gray-900">
          Ralph Control Panel
        </h1>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Review briefs and monitor build progress
        </p>
      </div>

      <DashboardTabs briefs={briefs} builds={builds} />
    </div>
  )
}
