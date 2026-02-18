'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const POLL_INTERVAL_MS = 1000
const MAX_POLLS = 30 // 30 seconds max

/**
 * Hook that polls router.refresh() after a user action to pick up
 * Airtable changes. Stops early when the data fingerprint changes
 * (meaning the server returned updated data) or after 30 seconds.
 *
 * @param dataFingerprint - A string that changes when the server data updates
 *   (e.g. sorted job IDs joined with commas). When this changes while polling,
 *   polling stops automatically.
 * @returns startPolling - Call this after a user action to begin polling.
 */
export function useActionPolling(dataFingerprint: string) {
  const router = useRouter()
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevFingerprintRef = useRef(dataFingerprint)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    let count = 0
    pollingRef.current = setInterval(() => {
      count++
      router.refresh()
      if (count >= MAX_POLLS) stopPolling()
    }, POLL_INTERVAL_MS)
  }, [router, stopPolling])

  // Stop polling when data fingerprint changes
  useEffect(() => {
    if (dataFingerprint !== prevFingerprintRef.current && pollingRef.current) {
      stopPolling()
    }
    prevFingerprintRef.current = dataFingerprint
  }, [dataFingerprint, stopPolling])

  // Clean up on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  return startPolling
}
