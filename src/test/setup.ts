import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock next/cache globally — cacheTag/cacheLife require Next.js server runtime
vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
})
