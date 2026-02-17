import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build an Airtable record URL for a given record ID.
 * Requires NEXT_PUBLIC_AIRTABLE_JOBS_URL env var (e.g. https://airtable.com/appXXX/tblYYY).
 * Returns undefined if the env var is not set.
 */
export function getAirtableRecordUrl(recordId: string): string | undefined {
  const prefix = process.env.NEXT_PUBLIC_AIRTABLE_JOBS_URL
  if (!prefix) return undefined
  return `${prefix}/${recordId}`
}
