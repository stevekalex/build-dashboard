import { getJobsToApprove } from '@/lib/queries/approve'
import { ApproveList } from '@/components/approve/approve-list'

export const revalidate = 15

export default async function ApprovePage() {
  const jobs = await getJobsToApprove()
  return <ApproveList jobs={jobs} />
}
