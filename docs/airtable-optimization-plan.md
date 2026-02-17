# Airtable Optimization Plan

## Problems Identified

| # | Problem | Impact |
|---|---------|--------|
| 1 | N+1 queries on `/approve` and `/ready-to-send` | 21 API calls for 20 records; rate limit risk |
| 2 | No Airtable client singleton | Redundant object construction on every call |
| 3 | No query-level cache or deduplication | Pages fetching overlapping data independently |
| 4 | `/approve` pays N+1 cost for non-buildable records it discards | Wasted API calls |
| 5 | Inbox queries silently double on missing fields | 5 calls instead of 3 on degraded path |
| 6 | `/briefs/[id]` has no caching | 2 sequential Airtable calls on every navigation |
| 7 | No pagination on most queries | Unbounded fetches as pipeline grows |
| 8 | No error recovery beyond ISR stale-serve | Dynamic pages have no fallback |
| 9 | No optimistic UI updates on mutations | Full round-trip latency on every action |

---

## Phase 1: Eliminate N+1 with Airtable Lookup Fields

**Solves:** #1, #4, #2 (singleton)
**Approach:** Create Lookup fields on Jobs Pipeline table that pull data from linked Build Details. Then delete all secondary `.find()` calls from the codebase.

### Step 1A: Create Lookup Fields in Airtable UI

On the **Jobs Pipeline** table, create these Lookup fields pointing at the linked **Build Details** record:

| New Lookup Field Name | Source Table | Source Field | Used By |
|---|---|---|---|
| `Build: Buildable` | Build Details | `Buildable` | `/approve` |
| `Build: Buildable Reasoning` | Build Details | `Buildable Reasoning` | `/approve` |
| `Build: Brief YAML` | Build Details | `Brief YAML` | `/approve`, `/ready-to-send` |
| `Build: Status` | Build Details | `Status` | `/approve`, legacy `airtable.ts` |
| `Build: Prototype URL` | Build Details | `Prototype URL` | `/ready-to-send`, legacy `airtable.ts` |
| `Build: Build Started` | Build Details | `Build Started` | legacy `airtable.ts` (getAllBuilds) |
| `Build: Build Completed` | Build Details | `Build Completed` | legacy `airtable.ts` (getAllBuilds) |
| `Build: Build Duration` | Build Details | `Build Duration` | legacy `airtable.ts` (getAllBuilds) |
| `Build: Build Error` | Build Details | `Build Error` | legacy `airtable.ts` (getAllBuilds) |

**Important:** Lookup fields on a 1-to-1 link return single-element arrays (e.g., `[true]` not `true`). Access as `record.get('Build: Buildable')?.[0]`.

### Step 1B: Update `airtable-fields.ts`

Add constants for the new Lookup field names. These map to the Lookup fields created in Step 1A.

### Step 1C: Refactor Query Functions

For each function that currently does N+1 Build Details lookups:

- **`queries/approve.ts` → `getJobsToApprove()`**: Remove `Promise.all` + `.find()` loop. Read lookup fields directly from Jobs Pipeline records. Move `buildable` check into `filterByFormula` (`{Build: Buildable} = TRUE()`).
- **`queries/ready-to-send.ts` → `getReadyToSend()`**: Same — remove secondary lookups, read from lookup fields.
- **`lib/airtable.ts` → `getBriefsPendingApproval()`**: Same pattern. (Legacy, used by `/briefs/[id]`.)
- **`lib/airtable.ts` → `getBriefById()`**: Remove the sequential Build Details `.find()`. Read lookup fields.
- **`lib/airtable.ts` → `getAllBuilds()`**: Same. (Currently unused but should be fixed for consistency.)

### Step 1D: Fix `getBase()` Singleton

Cache the Airtable base instance at module level.

### Expected Result

| Page | Before | After |
|---|---|---|
| `/approve` (20 records) | 21 API calls | **1 call** |
| `/ready-to-send` (20 records) | 21 API calls | **1 call** |
| `/briefs/[id]` | 2 sequential calls | **1 call** |

---

## Phase 2: Query-Level Caching with `use cache`

**Solves:** #3, #5, #6, #7, #8
**Requires:** Next.js 16 `cacheComponents: true` in `next.config.ts`

### Step 2A: Enable `cacheComponents`

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
}
```

### Step 2B: Wrap Query Functions with `use cache`

Each query function gets `'use cache'` + `cacheTag()` + `cacheLife()`:

| Function | Tag | Lifetime |
|---|---|---|
| `getJobsToApprove()` | `'jobs-approve'` | `'seconds'` (~15s) |
| `getHotLeads()` | `'jobs-inbox'` | `'seconds'` |
| `getAwaitingResponse()` | `'jobs-inbox'` | `'seconds'` |
| `getFollowUpsDue()` | `'jobs-inbox'` | `'seconds'` |
| `getActiveDeals()` | `'jobs-closing'` | `'seconds'` |
| `getReadyToSend()` | `'jobs-ready-to-send'` | `'seconds'` |
| `getDailyMetrics()` | `'jobs-metrics'` | `'minutes'` |
| `getPipelineCounts()` | `'jobs-pipeline'` | `'minutes'` |
| `getBriefById(id)` | `'brief-{id}'` | `'minutes'` |

### Step 2C: Replace `revalidatePath` with `revalidateTag` in Mutations

| Action | Current | New |
|---|---|---|
| `approveBrief()` | `revalidatePath('/approve')` | `revalidateTag('jobs-approve')` + `revalidateTag('jobs-pipeline')` |
| `rejectBrief()` | `revalidatePath('/approve')` | `revalidateTag('jobs-approve')` + `revalidateTag('jobs-pipeline')` |
| `logResponse()` | `revalidatePath('/inbox')` | `revalidateTag('jobs-inbox')` + `revalidateTag('jobs-pipeline')` |
| `markFollowedUp()` | `revalidatePath('/inbox')` | `revalidateTag('jobs-inbox')` |
| `saveLoomUrl()` | `revalidatePath('/ready-to-send')` | `revalidateTag('jobs-ready-to-send')` |
| `markApplied()` | `revalidatePath('/ready-to-send')` | `revalidateTag('jobs-ready-to-send')` + `revalidateTag('jobs-inbox')` |
| `markContractSent()` | `revalidatePath('/closing')` | `revalidateTag('jobs-closing')` |
| `markLost()` | `revalidatePath('/closing')` | `revalidateTag('jobs-closing')` + `revalidateTag('jobs-pipeline')` |

### Step 2D: Remove Page-Level `revalidate` Exports

Delete `export const revalidate = 15` / `60` from all pages. Caching now lives at the query layer.

### Step 2E: Clean Up Inbox Fallback Logic

With `use cache`, the double-call-on-missing-fields pattern in `getAwaitingResponse()` and `getFollowUpsDue()` can be simplified. If the fields exist now (verify), remove the try/catch fallback entirely.

### Expected Result

- Query results cached at data level, shared across pages
- Precise invalidation via tags (no over-fetching on mutations)
- `/briefs/[id]` gets caching for the first time
- Stale-while-revalidate handles Airtable outages gracefully

---

## Phase 3: Polish (Low Priority)

**Solves:** #9, #7

### Step 3A: `useOptimistic` for Mutations

Add React 19 `useOptimistic` to client components (approve dialog, inbox actions) for instant UI feedback.

### Step 3B: Add `maxRecords` to Unbounded Queries

Add sensible limits to queries that currently use `.all()` without bounds:
- `getHotLeads()`: `maxRecords: 50`
- `getAwaitingResponse()`: `maxRecords: 100`
- `getFollowUpsDue()`: `maxRecords: 50`
- `getActiveDeals()`: `maxRecords: 50`
