import { TABLES, JOBS, STAGES } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { PipelineCounts } from '@/types/brief'
import { cacheTag, cacheLife } from 'next/cache'

/**
 * Fetch all jobs and count them by stage group.
 * More efficient than running 12 separate filtered queries.
 */
export async function getPipelineCounts(): Promise<PipelineCounts> {
  'use cache'
  cacheTag('jobs-pipeline')
  cacheLife('analytics')
  const base = getBase()
  const records = await base(TABLES.JOBS_PIPELINE)
    .select({
      fields: [JOBS.STAGE],
      maxRecords: 500,
    })
    .all()

  const counts: PipelineCounts = {
    new: 0,
    pendingApproval: 0,
    approved: 0,
    building: 0,
    deployed: 0,
    applied: 0,
    followUps: 0,
    engaging: 0,
    closedWon: 0,
    closedLost: 0,
    buildFailed: 0,
    rejected: 0,
  }

  for (const record of records) {
    const stage = (record.get(JOBS.STAGE) as string) || ''
    switch (stage) {
      case STAGES.NEW:
        counts.new++
        break
      case STAGES.PENDING_APPROVAL:
        counts.pendingApproval++
        break
      case STAGES.APPROVED:
        counts.approved++
        break
      case STAGES.PROTOTYPE_BUILDING:
        counts.building++
        break
      case STAGES.DEPLOYED:
      case STAGES.PROTOTYPE_BUILT:
        counts.deployed++
        break
      case STAGES.SEND_LOOM:
        counts.deployed++
        break
      case STAGES.TOUCHPOINT_1:
      case STAGES.TOUCHPOINT_2:
      case STAGES.TOUCHPOINT_3:
        counts.followUps++
        break
      case STAGES.LIGHT_ENGAGEMENT:
      case STAGES.ENGAGEMENT_WITH_PROTOTYPE:
        counts.engaging++
        break
      case STAGES.CLOSED_WON:
        counts.closedWon++
        break
      case STAGES.CLOSED_LOST:
        counts.closedLost++
        break
      case STAGES.BUILD_FAILED:
        counts.buildFailed++
        break
      case STAGES.REJECTED:
        counts.rejected++
        break
    }
  }

  return counts
}
