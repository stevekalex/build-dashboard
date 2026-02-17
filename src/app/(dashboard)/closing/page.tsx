import { getActiveDeals, groupDealsByStatus } from '@/lib/queries/closing'
import { ClosingBoard } from '@/components/closing/closing-board'

export const revalidate = 15

export default async function ClosingPage() {
  const deals = await getActiveDeals()
  const grouped = groupDealsByStatus(deals)
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-3xl font-bold text-gray-900">Closing Dashboard</h1>
        <p className="text-xs md:text-base text-gray-600 mt-1">Active deals in progress</p>
      </div>
      <ClosingBoard {...grouped} />
    </div>
  )
}
