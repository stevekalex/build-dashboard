import { TABLES, JOBS } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { DailyMetrics } from '@/types/brief'

async function countByDateToday(field: string): Promise<number> {
  try {
    const base = getBase()
    const records = await base(TABLES.JOBS_PIPELINE)
      .select({
        filterByFormula: `IS_SAME({${field}}, TODAY(), 'day')`,
        fields: [field], // only fetch the field we need
      })
      .all()
    return records.length
  } catch {
    return 0 // field may not exist yet
  }
}

export async function getDailyMetrics(): Promise<DailyMetrics> {
  const [
    jobsDetected,
    jobsApproved,
    prototypesBuilt,
    applicationsSent,
    responsesReceived,
    callsCompleted,
    contractsSigned,
  ] = await Promise.all([
    countByDateToday(JOBS.SCRAPED_AT),
    countByDateToday(JOBS.APPROVED_DATE),
    countByDateToday(JOBS.DEPLOYED_DATE),
    countByDateToday(JOBS.APPLIED_AT),
    countByDateToday(JOBS.RESPONSE_DATE),
    countByDateToday(JOBS.CALL_COMPLETED_DATE),
    countByDateToday(JOBS.CLOSE_DATE),
  ])

  return {
    jobsDetected,
    jobsApproved,
    prototypesBuilt,
    applicationsSent,
    responsesReceived,
    callsCompleted,
    contractsSigned,
    date: new Date().toISOString().split('T')[0],
  }
}
