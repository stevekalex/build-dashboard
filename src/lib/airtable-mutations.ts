import type { FieldSet } from 'airtable'
import { getBase } from './airtable'
import { TABLES, JOBS } from './airtable-fields'

/**
 * Update specific fields on a Jobs Pipeline record.
 * Used for CRM operations that don't involve Ralph/Job Pulse.
 */
export async function updateJobField(
  recordId: string,
  fields: Partial<FieldSet>
): Promise<void> {
  const base = getBase()
  await base(TABLES.JOBS_PIPELINE).update(recordId, fields)
}

/**
 * Update a job's stage and optionally set additional fields.
 */
export async function updateJobStage(
  recordId: string,
  stage: string,
  additionalFields?: Partial<FieldSet>
): Promise<void> {
  const base = getBase()
  await base(TABLES.JOBS_PIPELINE).update(recordId, {
    [JOBS.STAGE]: stage,
    ...additionalFields,
  })
}
