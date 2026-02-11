# CLAUDE.md - Ralph Control Panel

## What This System Is

The Ralph Control Panel is a **human-in-the-loop approval interface** for the Ralph prototype generation system. When Ralph operates in manual approval mode, it evaluates job briefs but does NOT auto-build. Instead, briefs appear in this dashboard where humans review and approve/reject them before committing build resources.

**Business Logic:**
- This is a **decision interface**, not a full admin panel
- Single purpose: review brief → approve or reject
- Approval triggers a 45-minute, $0.50 build via Job Pulse
- Speed matters: decision should take <60 seconds
- If it takes longer to decide, the brief is probably too complex

---

## Architecture Mental Model

```
Airtable (source of truth) ← Job Pulse (orchestrator) → Ralph (builder)
         ↕
   Control Panel (approval UI)
```

**Key Insight**: Control Panel never talks to Ralph directly. It calls Job Pulse, which manages Airtable state and forwards approved builds to Ralph.

**Proxy Pattern (Option B)**:
- Control Panel → `POST /api/builds/trigger/:jobId` → Job Pulse
- Job Pulse → fetches brief from Airtable → calls Ralph
- This keeps Job Pulse as single source of truth for Airtable

---

## Tech Stack

- **Next.js 15** (App Router) - Server-first rendering, Server Actions
- **shadcn/ui** - Copy-paste components (not npm package)
- **TypeScript** - Strict mode
- **Airtable** - Jobs Pipeline table (Stage: "⏸️ Pending Approval")
- **Tailwind CSS** - Utility-first styling

**Critical**: Most components should be Server Components. Only add "use client" for interactivity (buttons, forms, dialogs).

---

## Project Structure

```
app/
├── (dashboard)/          # Dashboard layout group
│   ├── layout.tsx       # Persistent layout with sidebar
│   ├── page.tsx         # Briefs list page (main view)
│   └── briefs/
│       └── [id]/        # Brief detail view
│           └── page.tsx
├── api/                 # API routes (if needed)
│   └── airtable/        # Proxy routes to Airtable
└── globals.css          # Tailwind imports

components/
├── ui/                  # shadcn/ui components (copied, not installed)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── badge.tsx
├── briefs/              # Domain-specific components
│   ├── brief-card.tsx
│   ├── approve-dialog.tsx
│   ├── reject-dialog.tsx
│   └── brief-status.tsx
└── layout/              # Layout components
    ├── header.tsx
    └── sidebar.tsx

lib/
├── airtable.ts          # Airtable API client
├── job-pulse.ts         # Job Pulse API client
└── utils.ts             # Helper functions (cn, date formatting)
```

---

## Data Flow

### Fetching Briefs (Server Component)

```typescript
// app/(dashboard)/page.tsx (Server Component)
import { getBriefsPendingApproval } from '@/lib/airtable'

export default async function BriefsPage() {
  const briefs = await getBriefsPendingApproval()
  return <BriefsTable briefs={briefs} />
}
```

**Pattern**: Fetch data in Server Components at page level. Pass as props to client components.

### Approving/Rejecting (Server Action)

```typescript
// app/actions.ts
'use server'

import { triggerBuild, rejectBuild } from '@/lib/job-pulse'

export async function approveBrief(jobId: string, approvedBy: string) {
  // Call Job Pulse, NOT Ralph
  const result = await triggerBuild(jobId, approvedBy)
  revalidatePath('/')
  return result
}
```

**Pattern**: Server Actions for mutations. Call Job Pulse API, revalidate page cache.

---

## Component Patterns

### Server Component (Default)

```typescript
// components/briefs/brief-card.tsx
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface BriefCardProps {
  brief: Brief
}

export function BriefCard({ brief }: BriefCardProps) {
  return (
    <Card>
      <h3>{brief.title}</h3>
      <Badge>{brief.template}</Badge>
      {/* No interactivity - stays server component */}
    </Card>
  )
}
```

### Client Component (Interactive)

```typescript
// components/briefs/approve-dialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { approveBrief } from '@/app/actions'

export function ApproveDialog({ jobId, brief }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await approveBrief(jobId, 'user@example.com')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Start Build</Button>
      </DialogTrigger>
      <DialogContent>
        <p>Are you sure? This will start a 45-minute build.</p>
        <Button onClick={handleApprove} disabled={loading}>
          {loading ? 'Starting...' : 'Confirm'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

**Rule**: Client components should be **small islands of interactivity** imported into Server Components.

---

## Airtable Integration

### Schema Overview

**Jobs Pipeline Table**:
- `Stage` (single select): "⏸️ Pending Approval", "✅ Approved", "🚫 Rejected"
- `Job ID` (formula): record ID
- `Build Details` (linked record): 1-to-1 relationship

**Build Details Table**:
- `Buildable` (checkbox): true/false from Ralph evaluation
- `Brief` (long text): YAML brief content
- `Template` (single select): "dashboard" | "web_app"

### Fetching Briefs

```typescript
// lib/airtable.ts
import Airtable from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
)

export async function getBriefsPendingApproval() {
  const records = await base('Jobs Pipeline')
    .select({
      filterByFormula: `{Stage} = "⏸️ Pending Approval"`,
      sort: [{ field: 'Created', direction: 'desc' }],
    })
    .all()

  return records.map((record) => ({
    id: record.id,
    jobId: record.get('Job ID'),
    title: record.get('Job Title'),
    buildable: record.get('Build Details')?.[0]?.fields?.Buildable,
    brief: record.get('Build Details')?.[0]?.fields?.Brief,
    createdAt: record.get('Created'),
  }))
}
```

**Pattern**: Server-side Airtable calls only. Never expose API keys to client.

---

## Job Pulse API Integration

### Approve Build (Proxy Pattern)

```typescript
// lib/job-pulse.ts
const JOB_PULSE_URL = process.env.JOB_PULSE_URL! // https://job-pulse.railway.app

export async function triggerBuild(jobId: string, approvedBy: string) {
  const response = await fetch(`${JOB_PULSE_URL}/api/builds/trigger/${jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved_by: approvedBy }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to trigger build')
  }

  return response.json()
}
```

**Critical**: Control Panel calls Job Pulse, NOT Ralph. Job Pulse handles:
1. Fetch brief from Airtable
2. Update Airtable stage to "✅ Approved"
3. Call Ralph `/api/build/start/:jobId`

### Error Handling

- **202 Accepted** → Success, refresh page
- **409 Conflict** → "Build already approved" (graceful message)
- **404 Not Found** → "Job not found" (shouldn't happen, but handle)
- **500 Error** → Show error toast with retry option

---

## UI/UX Patterns

### Brief Status Badge

```typescript
// components/briefs/brief-status.tsx
import { Badge } from '@/components/ui/badge'

export function BriefStatus({ buildable }: { buildable: boolean }) {
  return (
    <Badge variant={buildable ? 'default' : 'destructive'}>
      {buildable ? '✅ Buildable' : '❌ Not Buildable'}
    </Badge>
  )
}
```

### Stale Build Detection

Briefs stuck in "✅ Approved" or "Building" for >60 minutes should show warning badge.

```typescript
function isStale(approvedAt: string): boolean {
  const sixtyMinutesAgo = Date.now() - 60 * 60 * 1000
  return new Date(approvedAt).getTime() < sixtyMinutesAgo
}
```

**UI**: Red border + "⚠️ Stuck Build" badge

---

## Testing Strategy

### Component Tests (Vitest + React Testing Library)

```typescript
// __tests__/brief-card.test.tsx
import { render, screen } from '@testing-library/react'
import { BriefCard } from '@/components/briefs/brief-card'

test('renders buildable badge', () => {
  render(<BriefCard brief={{ buildable: true, title: 'Test' }} />)
  expect(screen.getByText('✅ Buildable')).toBeInTheDocument()
})
```

### Integration Tests (Playwright)

```typescript
// e2e/approve-flow.spec.ts
test('approve build flow', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Start Build')
  await page.click('text=Confirm')
  await expect(page.locator('text=Build started')).toBeVisible()
})
```

**Priority**: Integration tests > unit tests. The value is in the full flow.

---

## Environment Variables

```bash
# .env.local
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
JOB_PULSE_URL=https://job-pulse.railway.app
NEXT_PUBLIC_APP_URL=https://control-panel.railway.app
```

**Critical**: Never expose Airtable API keys to client. All Airtable calls must be server-side.

---

## Development Workflow

### Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build

# Run tests
npm test
```

### Adding shadcn/ui Components

```bash
# Install specific component (copies source code, not npm package)
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add table
```

**Pattern**: Only install components you need. Each is independent.

---

## Common Pitfalls

### ❌ Don't Call Ralph Directly

```typescript
// BAD: Calling Ralph directly
await fetch('https://ralph.railway.app/api/build/start/...')
```

```typescript
// GOOD: Calling Job Pulse (proxy pattern)
await fetch('https://job-pulse.railway.app/api/builds/trigger/...')
```

### ❌ Don't Make Client Components Too Large

```typescript
// BAD: Entire page is client component
'use client'
export default function BriefsPage() { ... } // Fetching data client-side
```

```typescript
// GOOD: Server Component page, Client Component button
export default async function BriefsPage() {
  const briefs = await getBriefs() // Server-side fetch
  return <BriefsList briefs={briefs} /> // Client component for interactivity
}
```

### ❌ Don't Hardcode Airtable Field Names

```typescript
// BAD: Brittle to Airtable schema changes
const title = record.get('Job Title')
```

```typescript
// GOOD: Use constants
const FIELDS = {
  JOB_TITLE: 'Job Title',
  STAGE: 'Stage',
  BUILD_DETAILS: 'Build Details',
} as const

const title = record.get(FIELDS.JOB_TITLE)
```

---

## Performance Optimization

### Caching Strategy

- **Briefs list**: Revalidate every 30 seconds (`revalidate: 30`)
- **Brief detail**: On-demand revalidation after approve/reject
- **Static pages**: Header, footer, about page

```typescript
// app/(dashboard)/page.tsx
export const revalidate = 30 // ISR with 30-second revalidation
```

### Server Actions for Mutations

```typescript
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function approveBrief(jobId: string) {
  await triggerBuild(jobId)
  revalidatePath('/') // Refresh briefs list
}
```

**Pattern**: Server Actions automatically revalidate. No client-side refetch needed.

---

## Deployment (Railway)

### Environment Variables

Set in Railway dashboard:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `JOB_PULSE_URL`
- `NEXT_PUBLIC_APP_URL`

### Build Configuration

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
```

Railway auto-detects Next.js and uses these commands.

### Health Check

Add `/api/health` route:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

---

## Decision-Making Frameworks

### Should This Brief Be Approved?

Ask in order:
1. Is it marked `buildable: true`? → No = reject with "Not buildable"
2. Does the brief show clear scope (1 user flow)? → No = reject with "Scope unclear"
3. Does it fit dashboard or web-app template? → No = reject with "No matching template"
4. Would I approve this if it cost me $0.50? → No = don't build

**Time limit**: If decision takes >2 minutes, reject and ask for clearer brief.

### When to Show "Stuck Build" Warning?

- Build in "✅ Approved" or "Building" stage for >60 minutes
- Show warning badge, allow admin to reset to "⏸️ Pending Approval"
- Log for investigation (may indicate Ralph crash or network issue)

---

## Logging Philosophy

**Log at boundaries:**
- When calling Job Pulse API (request + response)
- When calling Airtable (query + results count)
- When user approves/rejects (action + user)
- When errors occur (full error + context)

```typescript
console.log({
  action: 'approve_brief',
  jobId,
  approvedBy,
  timestamp: new Date().toISOString(),
})
```

**Production**: Use structured logging (Pino, Winston) and send to logging service.

---

## The Prime Directive

**This dashboard exists to answer one question**: "Should we build this prototype?"

- If the answer isn't obvious in 60 seconds, the brief is unclear → reject
- If you're second-guessing, reject (better to waste 10 seconds rejecting than 45 minutes building wrong thing)
- The dashboard should feel **fast and decisive**, not exploratory

Over-complicating the UI doesn't help users decide—clarity does.

---

## Sources

This CLAUDE.md was created using best practices from:

- [The Complete Guide to CLAUDE.md](https://www.builder.io/blog/claude-md-guide)
- [Writing a good CLAUDE.md | HumanLayer Blog](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [How to Use claude.md for AI Coding](https://apidog.com/blog/claude-md/)
- [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [Next.js 15: App Router — A Complete Senior-Level Guide](https://medium.com/@livenapps/next-js-15-app-router-a-complete-senior-level-guide-0554a2b820f7)
- [Best Practices for Using shadcn/ui in Next.js](https://insight.akarinti.tech/best-practices-for-using-shadcn-ui-in-next-js-2134108553ae)
- [Next js Folder Structure Best Practices](https://www.codebydeep.com/blog/next-js-folder-structure-best-practices-for-scalable-applications-2026-guide)
