import type { FieldSet } from 'airtable'
import { getBase } from './airtable'
import { TABLES, JOBS } from './airtable-fields'
import { captureError } from './sentry'

/**
 * Update specific fields on a Jobs Pipeline record.
 * Used for CRM operations that don't involve Ralph/Job Pulse.
 * Throws on failure — callers (server actions) are responsible for catching.
 */
export async function updateJobField(
  recordId: string,
  fields: Partial<FieldSet>
): Promise<void> {
  try {
    const base = getBase()
    await base(TABLES.JOBS_PIPELINE).update(recordId, fields)
  } catch (error) {
    captureError(error, { action: 'updateJobField', recordId })
    console.error('Airtable updateJobField failed:', {
      recordId,
      fields: Object.keys(fields),
      error: error instanceof Error ? error.message : error,
    })
    throw error
  }
}

/**
 * Update a job's stage and optionally set additional fields.
 * Throws on failure — callers (server actions) are responsible for catching.
 */
export async function updateJobStage(
  recordId: string,
  stage: string,
  additionalFields?: Partial<FieldSet>
): Promise<void> {
  try {
    const base = getBase()
    await base(TABLES.JOBS_PIPELINE).update(recordId, {
      [JOBS.STAGE]: stage,
      ...additionalFields,
    })
  } catch (error) {
    captureError(error, { action: 'updateJobStage', recordId, stage })
    console.error('Airtable updateJobStage failed:', {
      recordId,
      stage,
      fields: additionalFields ? Object.keys(additionalFields) : [],
      error: error instanceof Error ? error.message : error,
    })
    throw error
  }
}
