# Plan: Transform Dashboard into Operations Management System

## Context

The Ralph Control Panel is currently a single-purpose build approval interface (2 tabs: Pending Approval + Build History). It needs to become a full operations management system supporting the entire daily founder workflow: checking Upwork inbox, recording Looms + sending applications, approving jobs, closing deals, and tracking metrics.

This replaces both the current dashboard AND the Google Sheets daily workflow. The goal is one tool for everything, backed by Airtable as the source of truth. Cash KPIs (21-25) are deferred.

---

## Current Airtable Schema (Full Metadata Audit)

### Jobs Pipeline Table (23 fields)

| Field | Type | Notes |
|---|---|---|
| `Job URL` | url | Upwork posting link |
| `Stage` | singleSelect | 17 options — see below |
| `Posted Date` | dateTime | When posted on Upwork |
| `Job Title` | singleLineText | |
| `Job Description` | multilineText | |
| `Build Details` | linkedRecord | Links to Build Details |
| `Budget Type` | singleSelect | Fixed / Hourly |
| `Budget Amount` | number | e.g. 2500 |
| `Budget Range` | singleLineText | e.g. "2500 USD" |
| `Skills` | multilineText | |
| `Duration` | singleLineText | e.g. "Less than 1 month" |
| `Scraped At` | dateTime | When Vollna scraped it |
| `Source` | singleSelect | Upwork |
| `Assigned To` | singleSelect | Steve / Karan / Dev |
| `AI Cover Letter` | multilineText | AI-generated cover letter |
| `AI Loom Outline` | multilineText | AI-generated Loom talking points |
| `Prototype URL` | url | Deployed prototype link |
| `Loom URL` | url | Loom recording link |
| `Prototype Status` | singleSelect | Not started / Unbuildable / Building / Built (Ready for QA) / Sent |
| `Applied At` | dateTime | When application was sent |
| `Next Action Date` | date | For follow-up scheduling |
| `Close Date` | date | When contract signed |
| `Vollna Filter` | singleLineText | Filter name that matched |
| `Connects Required` | number | Upwork connects cost |

#### Stage Options (all 17 already exist)

```
🆕 New
⏸️ Pending Approval
✅ Approved
🚫 Rejected
⚠️ Build Failed
🔨 Prototype Building
🎁 Prototype Built
🎥 Send Loom
🏗️ Deployed
💌 Initial message sent
📆 Touchpoint 1
📆 Touchpoint 2
📆 Touchpoint 3
🧐 Light Engagement
🕺 Engagement with prototype
🏁 Closed Won
➡️ Closed Lost
```

### Build Details Table (16 fields — NO changes needed)

| Field | Type |
|---|---|
| `Name` | singleLineText |
| `Jobs Pipeline` | linkedRecord |
| `Status` | singleSelect (Evaluated / Unbuildable / Building / Completed / Failed) |
| `Buildable` | checkbox |
| `Buildable Reasoning` | multilineText |
| `Brief YAML` | multilineText |
| `Prototype URL` | url |
| `Unique Interactions` | singleLineText |
| `Build Duration` | number |
| `Build Started` | dateTime |
| `Build Completed` | dateTime |
| `Build Error` | multilineText |
| `Notes` | multilineText |
| `Decision Date` | dateTime |
| `Decision Made By` | singleLineText |
| `Rejection Reason` | multilineText |

---

## Airtable Changes Required

### 11 New Fields on Jobs Pipeline

| # | Field | Type | Purpose |
|---|---|---|---|
| 1 | `Approved Date` | dateTime | Stamped when approved. Feeds "Jobs Approved" metric + "Avg hours to approve" |
| 2 | `Deployed Date` | dateTime | Stamped when deployed. Feeds "Prototypes Built" metric |
| 3 | `Loom Recorded Date` | dateTime | Stamped when Loom URL saved. Feeds "Looms recorded" metric |
| 4 | `Response Date` | dateTime | When client responds. Feeds "Responses Received" metric |
| 5 | `Response Type` | singleSelect | Message / Shortlist / Interview / Hire / Decline / Hired Other |
| 6 | `Call Completed Date` | dateTime | After closing call. Feeds "Calls Completed" metric |
| 7 | `Contract Sent Date` | dateTime | When contract sent to client |
| 8 | `Deal Value` | number/currency | Contract amount. **Spec says "confirm" but it does NOT exist — must create** |
| 9 | `Lost Reason` | singleLineText | Why deal was lost |
| 10 | `Client` | singleLineText | Client/company name |
| 11 | `Last Follow Up Date` | dateTime | When last follow-up was sent |

### Fields That Already Exist (no action needed)

- `Applied At` ✅ — need to confirm it's being populated by backend
- `Close Date` ✅ — need to confirm it's being populated
- `Loom URL` ✅
- `AI Cover Letter` ✅
- `AI Loom Outline` ✅
- `Job URL` ✅
- `Budget Amount` ✅
- `Prototype URL` ✅
- `Next Action Date` ✅ — use for follow-up scheduling
- `Prototype Status` ✅
- `Assigned To` ✅

### Follow-up Tracking — Use Existing Stages (no `Follow Up Stage` field needed)

The spec proposed a separate `Follow Up Stage` field. But the **existing stage model already has follow-up progression built in**:

```
💌 Initial message sent  →  📆 Touchpoint 1  →  📆 Touchpoint 2  →  📆 Touchpoint 3  →  ➡️ Closed Lost
```

Combined with `Next Action Date` (already exists) and `Last Follow Up Date` (new), this gives us full follow-up tracking without an extra field.

### Stages — No Changes Needed

The existing 17-stage model covers the full pipeline. For sub-states not covered by stages (contract sent, call done), we use field presence instead (e.g., `Contract Sent Date` not empty).

### Build Details — No Changes Needed

All required fields already exist.

---

## Architecture Decisions

### 1. Direct Airtable Writes for CRM Operations

- **Job Pulse**: Keep for approve/reject only (triggers Ralph builds)
- **Direct Airtable**: All 8 new CRM operations (log response, follow up, save Loom URL, mark applied, call done, contract sent/signed, mark lost)

### 2. Route-Per-View Navigation (Not Tabs)

| Route | View | Priority |
|---|---|---|
| `/inbox` | Upwork Inbox (default) | P1 |
| `/ready-to-send` | Loom + Apply queue | P1 |
| `/approve` | Jobs to Approve | P1 |
| `/closing` | Closing Dashboard | P2 |
| `/pulse` | Daily Pulse metrics | P3 |
| `/pipeline` | Pipeline Overview | P3 |

### 3. Field Constants + Query Modules

- `src/lib/airtable-fields.ts` — All field names + stage values as constants
- `src/lib/queries/{view}.ts` — Per-view query functions
- Existing `airtable.ts` refactored to export `getBase()` + shared helpers

---

## View Filter Logic (Mapped to Actual Airtable Schema)

### View 1: Upwork Inbox — 3 Sections

**Hot Leads:**
```
Response Type IN (Shortlist, Interview, Hire)
AND Stage NOT IN (🏁 Closed Won, ➡️ Closed Lost)
```

**Log Responses (awaiting response):**
```
Stage IN (💌 Initial message sent, 📆 Touchpoint 1, 📆 Touchpoint 2, 📆 Touchpoint 3)
AND Response Date = BLANK()
```

**Follow-ups Due:**
```
Applied At NOT BLANK()
AND Response Date = BLANK()
AND Next Action Date <= TODAY()
AND Stage NOT IN (🏁 Closed Won, ➡️ Closed Lost)
```

### View 2: Ready to Send

```
Stage IN (🏗️ Deployed, 🎁 Prototype Built)
AND Applied At = BLANK()
Sort: Scraped At ASC (oldest first — speed advantage)
```

### View 3: Jobs to Approve

```
Stage = ⏸️ Pending Approval
(Build Details → Buildable = true, checked via linked record)
Sort: Scraped At ASC (oldest first)
```

### View 4: Closing Dashboard

```
Stage IN (🧐 Light Engagement, 🕺 Engagement with prototype)
OR (Response Type NOT BLANK() AND Stage NOT IN (🏁 Closed Won, ➡️ Closed Lost))
```

Kanban columns by field presence: Engaged → Call Done → Contract Sent → Won

### View 5: Daily Pulse — 7 Metrics

| Metric | Filter | Field |
|---|---|---|
| Jobs Detected | `Scraped At` = today | existing |
| Jobs Approved | `Approved Date` = today | new |
| Prototypes Built | `Deployed Date` = today | new |
| Applications Sent | `Applied At` = today | existing |
| Responses Received | `Response Date` = today | new |
| Calls Completed | `Call Completed Date` = today | new |
| Contracts Signed | `Close Date` = today | existing |

### View 6: Pipeline Overview

Count by Stage groups:
- New / Pending Approval / Building / Deployed / Applied / Follow-ups / Engaging / Won / Lost / Failed

---

## Implementation Phases

### Phase 0: Foundation

**Create:**
- `src/lib/airtable-fields.ts` — All 34 field name constants (23 existing + 11 new) + 17 stage values + response types
- `src/lib/airtable-mutations.ts` — `updateJobField()`, `updateJobStage()` helpers

**Modify:**
- `src/types/brief.ts` — Add unified `Job` interface, `DailyMetrics`, `PipelineCounts`
- `src/lib/airtable.ts` — Export `getBase()`, use field constants, remove debug logs
- `src/components/layout/sidebar.tsx` — 6-view navigation with icons, active states
- `src/app/(dashboard)/page.tsx` — Redirect to `/inbox`

### Phase 1: View 3 — Jobs to Approve

Adapts existing approval flow. Lowest risk starting point.

**Create:**
- `src/lib/queries/approve.ts`
- `src/app/(dashboard)/approve/page.tsx`
- `src/components/approve/approve-list.tsx` — Cards: title, budget, buildable reasoning, skills, age. Approve + Skip

**Reuse:** Existing `approve-dialog.tsx`, `reject-dialog.tsx`

**Server actions** (`src/app/actions/approve.ts`):
- `approveBrief()` — Job Pulse + stamps `Approved Date`
- `skipBrief()` — direct Airtable write, Stage → `🚫 Rejected`

### Phase 2: View 2 — Ready to Send

5-step sequential workflow per job card.

**Create:**
- `src/lib/queries/ready-to-send.ts`
- `src/app/(dashboard)/ready-to-send/page.tsx`
- `src/components/ready-to-send/send-queue.tsx`
- `src/components/ready-to-send/send-card.tsx` — Steps: Open Prototype → Record Loom → Copy Cover Letter → Open Upwork → Mark Applied
- `src/components/ready-to-send/loom-input.tsx`

**Server actions** (`src/app/actions/ready-to-send.ts`):
- `saveLoomUrl()` — writes `Loom URL` + stamps `Loom Recorded Date`
- `markApplied()` — stamps `Applied At`, Stage → `💌 Initial message sent`

### Phase 3: View 1 — Upwork Inbox

Most complex. 3 collapsible sections with contextual actions.

**Create:**
- `src/lib/queries/inbox.ts` — 3 queries (hot leads, awaiting response, follow-ups due)
- `src/app/(dashboard)/inbox/page.tsx`
- `src/components/inbox/inbox-view.tsx`
- `src/components/inbox/inbox-section.tsx`
- `src/components/inbox/inbox-card.tsx`
- `src/components/inbox/log-response-dialog.tsx`
- `src/components/inbox/close-deal-dialog.tsx`

**Server actions** (`src/app/actions/inbox.ts`):
- `logResponse()` — stamps `Response Date` + `Response Type`, advances Stage to `🧐 Light Engagement`
- `markFollowedUp()` — advances Stage (Touchpoint 1→2→3), stamps `Last Follow Up Date`, updates `Next Action Date`
- `closeNoResponse()` — Stage → `➡️ Closed Lost`, Lost Reason = "No response"
- `markCallDone()` — stamps `Call Completed Date`
- `markContractSigned()` — stamps `Close Date`, writes `Deal Value`, Stage → `🏁 Closed Won`

### Phase 4: View 4 — Closing Dashboard

Kanban board for active deals.

**Create:**
- `src/lib/queries/closing.ts`
- `src/app/(dashboard)/closing/page.tsx`
- `src/components/closing/closing-board.tsx` — Reuse build-kanban pattern
- `src/components/closing/deal-card.tsx`

**Server actions** (`src/app/actions/closing.ts`):
- `markContractSent()` — stamps `Contract Sent Date`
- `markLost()` — writes `Lost Reason`, Stage → `➡️ Closed Lost`

### Phase 5: View 5 — Daily Pulse

**Create:**
- `src/lib/queries/metrics.ts` — 7 count queries by date = today, run in `Promise.all()`
- `src/app/(dashboard)/pulse/page.tsx`
- `src/components/pulse/daily-metrics.tsx`
- `src/components/pulse/metric-card.tsx`

### Phase 6: View 6 — Pipeline Overview

**Create:**
- `src/app/(dashboard)/pipeline/page.tsx`
- `src/components/pipeline/pipeline-funnel.tsx`
- `src/components/pipeline/stage-card.tsx`

### Phase 7: Cleanup

- Remove: `dashboard-tabs.tsx`, `briefs-list-responsive.tsx`, `briefs-table.tsx`, `brief-card-mobile.tsx`
- Update brief detail page back link
- Migrate old `actions.ts` to `actions/` directory

---

## Server Actions

```
src/app/actions/
  approve.ts          — approveBrief, skipBrief
  ready-to-send.ts    — saveLoomUrl, markApplied
  inbox.ts            — logResponse, markFollowedUp, closeNoResponse, markCallDone, markContractSigned
  closing.ts          — markContractSent, markLost
```

Pattern: `'use server'` → get user from cookie → write to Airtable (direct) or Job Pulse (build ops only) → `revalidatePath()` → return `{ success, error? }`

---

## Summary

- **11 new Airtable fields** to create on Jobs Pipeline
- **0 Build Details changes**, **0 new stages**
- **~30 new files** (queries, pages, components, actions)
- **~6 files modified**
- **~4 files deprecated** after migration

---

## Verification

Per view:
1. `npm run build` — no TypeScript errors
2. `npm run dev` — route loads with Airtable data
3. Test each server action on a real record
4. Mobile responsiveness
5. `npm test` — existing tests pass

End-to-end: Walk through full daily workflow (Inbox → Ready to Send → Approve) and verify data flows between views.
