# Build Monitoring & History Feature

**Status**: Planning Phase
**Created**: 2026-02-11

---

## Overview

Expand the Ralph Control Panel to monitor builds in progress and track build history. Currently the dashboard only handles approval/rejection of briefs. This feature adds visibility into:

1. Builds currently in progress
2. Completed builds (with URLs, duration, quality)
3. Failed builds (with error information)
4. Historical build tracking

**Primary Goal**: Map build quality to logs and specs to understand what makes good builds.

---

## Architecture Decision: Airtable as Central Source

**Decision**: Poll Airtable for all build data (status, logs, metadata)

**Rationale**:
- Dashboard already reads from Airtable for pending briefs
- Job Pulse owns Airtable writes - consistent pattern
- Ralph will write logs to Airtable (batched every 10-15 seconds)
- Single source of truth - no direct Ralph dependency for monitoring
- At 1-2 concurrent builds, Airtable rate limits (5 req/sec) won't be an issue

**Data Flow**:
```
┌─────────────────────────────────────────────────────────────────┐
│                         AIRTABLE                                │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │ Jobs Pipeline   │◄───│ Build Details                    │   │
│  │                 │    │  - Status (Building/Completed/…) │   │
│  │ Stage:          │    │  - Build Started / Completed     │   │
│  │  ✅ Approved    │    │  - Build Logs ← FUTURE           │   │
│  │  🏗️ Deployed    │    │  - Notes ← FUTURE                │   │
│  │  ⚠️ Build Failed│    │  - Prototype URL                 │   │
│  └─────────────────┘    └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ polls every 15s              │ writes logs every 10s (future)
         │                              │
    ┌────┴──────┐                  ┌────┴────┐
    │ Dashboard │                  │  Ralph  │
    └───────────┘                  └─────────┘
```

---

## Airtable Schema (Current)

### Jobs Pipeline Table
| Field | Type | Notes |
|-------|------|-------|
| Stage | Select | 🆕 New, ⏸️ Pending Approval, ✅ Approved, 🚫 Rejected, 🏗️ Deployed, ⚠️ Build Failed |
| Job Title | Text | |
| Job Description | Long text | |
| Budget Amount | Number | |
| Posted Date | Date | |

### Build Details Table
| Field | Type | Notes |
|-------|------|-------|
| Status | Select | Building, Evaluated, Completed, Failed, Unbuildable |
| Buildable | Checkbox | |
| Brief YAML | Text | Serialized YAML |
| Prototype URL | URL | Live prototype URL |
| Build Duration | Number | Seconds |
| Build Started | Date | ISO 8601 |
| Build Completed | Date | ISO 8601 |
| Build Error | Long text | Error message |
| Buildable Reasoning | Long text | |

### Schema Additions (Future)
| Field | Table | Type | Purpose |
|-------|-------|------|---------|
| Build Logs | Build Details | Long text | Cumulative logs from Ralph |
| Notes | Build Details | Long text | Human annotations |

---

## Implementation Phases

### Phase 1: Basic Build History View (MVP) ← CURRENT

**Goal**: Kanban-style view of all builds organized by stage

**Features**:
- Fetch all builds from Airtable (not just pending)
- Group by stage: Building, Deployed, Failed
- Display key metadata per build:
  - Job title
  - Build status
  - Start time
  - Duration (if completed)
  - Prototype URL (if deployed)
  - Error (if failed)
- Click to expand for full details
- Auto-refresh every 30 seconds

**New Route**: `/builds` or `/history`

**UI Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  Build History                                    [Refresh]  │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Building   │  │  Deployed   │  │   Failed    │          │
│  │     (2)     │  │    (15)     │  │     (3)     │          │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤          │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │          │
│  │ │ CRM App │ │  │ │Analytics│ │  │ │ Broken  │ │          │
│  │ │ 12m ago │ │  │ │ 45m     │ │  │ │ Error:  │ │          │
│  │ └─────────┘ │  │ │ [URL]   │ │  │ │ TS fail │ │          │
│  │ ┌─────────┐ │  │ └─────────┘ │  │ └─────────┘ │          │
│  │ │ Portal  │ │  │ ┌─────────┐ │  │             │          │
│  │ │ 3m ago  │ │  │ │Dashboard│ │  │             │          │
│  │ └─────────┘ │  │ │ 32m     │ │  │             │          │
│  └─────────────┘  │ │ [URL]   │ │  └─────────────┘          │
│                   │ └─────────┘ │                            │
│                   └─────────────┘                            │
└──────────────────────────────────────────────────────────────┘
```

### Phase 2: Live Logs (Future)

**Goal**: Show real-time build logs during active builds

**Requirements**:
- Add `Build Logs` field to Airtable Build Details
- Ralph batches logs locally, writes to Airtable every 10-15s
- Dashboard polls Airtable for log updates
- Display logs in scrollable panel
- Auto-scroll to bottom during active build
- Truncate logs after build completes (or store summary)

**Airtable Concerns**:
- 100KB limit per long text field
- Mitigation: Ralph writes last N lines only, or compresses

### Phase 3: Notes & Annotations (Future)

**Goal**: Human annotations for builds

**Features**:
- Add `Notes` field to Airtable Build Details
- Editable notes field in dashboard
- Notes updates go through Job Pulse (maintains Airtable ownership)
- Track who edited and when
- Use for quality feedback, issues, learnings

### Phase 4: Quality Metrics (Future)

**Goal**: Track and visualize build quality over time

**Features**:
- Success rate trends
- Average build duration
- Common failure reasons
- Quality scores (if AI-evaluated)
- Filter by template type, date range

---

## Technical Implementation (Phase 1)

### New Files Needed

```
src/
├── app/
│   └── (dashboard)/
│       └── builds/
│           └── page.tsx          # Build history page (server component)
├── components/
│   └── builds/
│       ├── build-kanban.tsx      # Kanban board layout (client)
│       ├── build-card.tsx        # Individual build card
│       ├── build-column.tsx      # Stage column
│       └── build-detail-dialog.tsx # Expanded view
└── lib/
    └── airtable.ts               # Add getAllBuilds() function
```

### Airtable Query

```typescript
// lib/airtable.ts
export async function getAllBuilds() {
  const records = await base('Jobs Pipeline')
    .select({
      filterByFormula: `OR(
        {Stage} = "✅ Approved",
        {Stage} = "🏗️ Deployed",
        {Stage} = "⚠️ Build Failed"
      )`,
      sort: [{ field: 'Created', direction: 'desc' }],
    })
    .all()

  // Fetch linked Build Details for each record
  // Return structured data
}
```

### Component Structure

```typescript
// app/(dashboard)/builds/page.tsx (Server Component)
export default async function BuildsPage() {
  const builds = await getAllBuilds()
  return <BuildKanban builds={builds} />
}

// components/builds/build-kanban.tsx (Client Component)
'use client'
export function BuildKanban({ builds }: { builds: Build[] }) {
  const building = builds.filter(b => b.status === 'Building')
  const deployed = builds.filter(b => b.status === 'Completed')
  const failed = builds.filter(b => b.status === 'Failed')

  return (
    <div className="grid grid-cols-3 gap-4">
      <BuildColumn title="Building" builds={building} />
      <BuildColumn title="Deployed" builds={deployed} />
      <BuildColumn title="Failed" builds={failed} />
    </div>
  )
}
```

---

## Open Questions

1. **Logs field size** - Are Ralph's logs typically under 100KB? If not, need truncation strategy.

2. **Notes via Job Pulse or direct?** - Job Pulse owns Airtable writes. Should notes go through Job Pulse (consistent) or can dashboard write directly (simpler)?

3. **Polling frequency** - 15s for active builds, 30s for history? Or single interval?

4. **Build history depth** - Show all time with pagination? Last N builds? Date range filter?

5. **Navigation** - Separate `/builds` route or tab within existing dashboard?

---

## Success Criteria

### Phase 1 (MVP)
- [ ] Can see all builds organized by status
- [ ] Can view build details (URL, duration, error)
- [ ] Auto-refreshes to show new builds
- [ ] Works on mobile (responsive)

### Phase 2 (Logs)
- [ ] Can see live logs for building jobs
- [ ] Logs persist in Airtable
- [ ] Logs don't exceed Airtable limits

### Phase 3 (Notes)
- [ ] Can add/edit notes on any build
- [ ] Notes saved to Airtable via Job Pulse
- [ ] Notes visible in build detail view

---

**Last Updated**: 2026-02-11
