import { getBriefsPendingApproval } from '@/lib/airtable'
import { BriefsTable } from '@/components/briefs/briefs-table'

export const revalidate = 15 // Revalidate every 15 seconds

export default async function DashboardPage() {
  const briefs = await getBriefsPendingApproval()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Briefs Pending Approval</h1>
        <p className="text-gray-600 mt-2">
          Review and approve briefs before starting builds
        </p>
      </div>

      <BriefsTable briefs={briefs} />
    </div>
  )
}
