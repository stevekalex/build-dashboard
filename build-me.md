  Build Prompt: Build Dashboard (Ralph Control Panel)                                                                               
   
  Context                                                                                                                           
                                                            
  You are building the Build Dashboard - a Next.js 15 control panel for manually approving/rejecting Ralph prototype builds. This
  dashboard is the human-in-the-loop approval interface for the Ralph system when running in manual approval mode.

  Key Documents Available:
  - CLAUDE.md - Complete project guidelines and patterns
  - MANUAL_APPROVAL_FEATURE.md - Full feature specification and requirements

  Read both files thoroughly before starting.

  ---
  Project Overview

  What you're building:
  A Next.js 15 dashboard that:
  1. Fetches briefs from Airtable (Stage: "⏸️ Pending Approval")
  2. Displays them in a table with key information
  3. Allows users to approve (→ triggers build via Job Pulse)
  4. Allows users to reject (→ with reason selection)
  5. Shows build status and updates via 15-second polling
  6. Has detailed brief view with formatted YAML

  Architecture:
  Airtable → Build Dashboard → Job Pulse → Ralph
           (reads briefs)    (triggers builds)

  Critical Rule: Dashboard calls Job Pulse API, NEVER Ralph directly.

  ---
  Step-by-Step Implementation

  Phase 1: Project Setup & Authentication (30 min)

  1.1 Verify Repository
  - Repository should already exist with CLAUDE.md and MANUAL_APPROVAL_FEATURE.md
  - If Next.js not initialized, run: npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
  - Install dependencies: npm install

  1.2 Install shadcn/ui
  npx shadcn@latest init
  # Choose: New York style, Zinc color, CSS variables
  npx shadcn@latest add button card badge table dialog input label textarea select

  1.3 Environment Setup
  Create .env.local:
  # Airtable
  AIRTABLE_API_KEY=<user will provide>
  AIRTABLE_BASE_ID=<user will provide>

  # Job Pulse
  NEXT_PUBLIC_JOB_PULSE_URL=<user will provide>

  # Auth
  ADMIN_PASSWORD=<user will provide>

  # App
  NEXT_PUBLIC_APP_URL=http://localhost:3000

  1.4 Build Simple Login Page
  - Create app/login/page.tsx
  - Form with:
    - Password field (verify against ADMIN_PASSWORD)
    - Name field (free text input)
  - On success: Store name in session cookie, redirect to /
  - Style with shadcn/ui components

  1.5 Auth Middleware
  - Create middleware.ts to protect routes
  - Check for valid session cookie
  - Redirect to /login if not authenticated

  1.6 Test Auth Flow
  - Verify login works
  - Verify redirect to dashboard
  - Verify session persists on refresh

  ---
  Phase 2: Airtable Integration (30 min)

  2.1 Install Airtable SDK
  npm install airtable

  2.2 Create Airtable Client
  lib/airtable.ts:
  - Initialize Airtable base with API key
  - Create getBriefsPendingApproval() function
  - Filter by: {Stage} = "⏸️ Pending Approval"
  - Fetch linked Build Details (Buildable, Brief, Template)
  - Return typed array of briefs

  2.3 Define Types
  types/brief.ts:
  interface Brief {
    id: string              // Airtable record ID
    jobId: string          // rec + 14 chars
    title: string          // Job Title
    description: string    // Job Description
    template: 'dashboard' | 'web_app'
    buildable: boolean
    brief: string          // Full YAML brief
    routes: any[]          // Parsed from brief
    uniqueInteractions?: string
    createdAt: string
    status: 'pending' | 'approved' | 'building' | 'complete' | 'failed'
  }

  2.4 Test Airtable Connection
  - Create test page that fetches and displays briefs
  - Verify data structure matches expectations
  - Handle errors gracefully (missing fields, etc.)

  ---
  Phase 3: Main Dashboard UI (45 min)

  3.1 Create Dashboard Layout
  app/(dashboard)/layout.tsx:
  - Sidebar navigation with logo "Build Dashboard"
  - Header showing logged-in user: "Logged in as: [Name]"
  - Logout button
  - Main content area

  3.2 Briefs List Page (Server Component)
  app/(dashboard)/page.tsx:
  - Fetch briefs server-side: await getBriefsPendingApproval()
  - Pass to client component for rendering

  3.3 Briefs Table Component (Client)
  components/briefs/briefs-table.tsx:

  Table Columns:
  1. Job Title (clickable → detail page)
  2. Description (truncated to 100 chars, "..." if longer)
  3. Template (Badge: "Dashboard" or "Web App")
  4. Buildable (Badge: "✅ Buildable" or "❌ Not Buildable")
  5. Routes (e.g., "3 routes")
  6. Created (relative time: "2 hours ago")
  7. Status (Badge with icon)
  8. Actions (Start Build / Don't Build buttons)

  Styling:
  - Use shadcn/ui Table component
  - Add hover effects
  - Responsive design
  - Empty state: "No briefs pending approval"

  3.4 Status Badges
  components/briefs/status-badge.tsx:
  - ⏸️ Pending (yellow)
  - ✅ Building (blue, animated)
  - ✅ Complete (green)
  - ❌ Failed (red)

  ---
  Phase 4: Approve Build Flow (30 min)

  4.1 Approve Dialog Component
  components/briefs/approve-dialog.tsx:

  Dialog Content:
  - Job title header
  - Brief preview:
    - Template type
    - Routes list (formatted)
    - Unique interactions (if any)
    - Done criteria
  - Warning: "This will start a ~45 minute build"
  - Confirm button (green) / Cancel button

  4.2 Job Pulse API Client
  lib/job-pulse.ts:
  export async function triggerBuild(jobId: string, approvedBy: string) {
    const response = await fetch(`${JOB_PULSE_URL}/api/builds/trigger/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_by: approvedBy }),
    })
    // Handle 202, 409, 404, 500
  }

  4.3 Approve Action (Server Action)
  app/actions.ts:
  'use server'
  export async function approveBrief(jobId: string, approvedBy: string) {
    await triggerBuild(jobId, approvedBy)
    revalidatePath('/')
    return { success: true }
  }

  4.4 Error Handling
  - 202 Accepted → Success toast, refresh list
  - 409 Conflict → "Build already approved" toast
  - 404 Not Found → "Job not found" error
  - 500 Error → Error toast with retry button

  ---
  Phase 5: Reject Build Flow (30 min)

  5.1 Reject Dialog Component
  components/briefs/reject-dialog.tsx:

  Dialog Content:
  - Job title header
  - "Why are you rejecting this brief?"
  - Radio buttons:
  ○ Scope too complex
  ○ Unclear requirements
  ○ Not a good fit for prototype
  ○ Client request
  ○ Other: [text field]
  - Selected reason required
  - Reject button (red) / Cancel button

  5.2 Reject API Call
  lib/job-pulse.ts:
  export async function rejectBuild(
    jobId: string,
    reason: string,
    rejectedBy: string
  ) {
    const response = await fetch(`${JOB_PULSE_URL}/api/builds/reject/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, rejected_by: rejectedBy }),
    })
    // Handle responses
  }

  5.3 Reject Action (Server Action)
  'use server'
  export async function rejectBrief(
    jobId: string,
    reason: string,
    rejectedBy: string
  ) {
    await rejectBuild(jobId, reason, rejectedBy)
    revalidatePath('/')
    return { success: true }
  }

  ---
  Phase 6: Brief Detail Page (30 min)

  6.1 Create Detail Route
  app/(dashboard)/briefs/[id]/page.tsx:
  - Fetch specific brief by ID
  - Server Component with data fetching

  6.2 Detail Page Layout
  components/briefs/brief-detail.tsx:

  Sections:
  1. Header:
    - Job title
    - Back button
    - Status badge
    - Actions (Approve/Reject) - same dialogs
  2. Overview:
    - Job description (full)
    - Template type
    - Buildable status
    - Created timestamp
  3. Brief YAML:
    - Formatted YAML with syntax highlighting
    - Copy button (copy to clipboard)
    - Collapsible sections (optional)

  6.3 Syntax Highlighting
  Install: npm install react-syntax-highlighter @types/react-syntax-highlighter

  Use in component:
  import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
  import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

  <SyntaxHighlighter language="yaml" style={oneDark}>
    {brief.brief}
  </SyntaxHighlighter>

  6.4 Copy Button
  - Use shadcn/ui Button
  - Copy YAML to clipboard
  - Show success toast: "Copied to clipboard"

  ---
  Phase 7: Polling & Real-time Updates (30 min)

  7.1 Polling Hook
  hooks/use-polling.ts:
  export function usePolling(interval: number = 15000) {
    useEffect(() => {
      const timer = setInterval(() => {
        router.refresh() // Revalidate server component data
      }, interval)
      return () => clearInterval(timer)
    }, [interval])
  }

  7.2 Add to Briefs Table
  'use client'
  export function BriefsTable({ briefs }) {
    usePolling(15000) // Poll every 15 seconds
    return <Table>...</Table>
  }

  7.3 Loading States
  - Show spinner in header during refresh
  - Optimistic UI updates (instant feedback on approve/reject)
  - Stale data indicator if poll fails

  ---
  Phase 8: UI Polish & Styling (30 min)

  8.1 Color Scheme
  Use shadcn/ui with unique accent:
  - Primary: Use zinc/slate base
  - Accent: Add unique color (e.g., violet, orange, or emerald)
  - Update tailwind.config.ts with custom color

  8.2 Sidebar Navigation
  - Logo/title: "Build Dashboard"
  - Navigation items:
    - 🏠 Briefs (main page)
    - 📊 Status (optional - build status overview)
    - ⚙️ Settings (optional)
  - User info at bottom with logout

  8.3 Responsive Design
  - Mobile: Collapse sidebar to hamburger menu
  - Table: Horizontal scroll on mobile
  - Dialogs: Full-screen on mobile

  8.4 Animations
  - Building status: Pulse animation
  - Page transitions: Smooth fade
  - Toast notifications: Slide in from top-right

  ---
  Phase 9: Error Handling & Edge Cases (20 min)

  9.1 Handle Missing Data
  - Brief has no routes → Show "No routes specified"
  - Brief has no unique interactions → Hide section
  - Description missing → Show "No description"

  9.2 Network Errors
  - Airtable API fails → Show error message, retry button
  - Job Pulse API fails → Show error toast, don't remove from list
  - Polling fails → Show indicator, continue retrying

  9.3 Session Expiry
  - Session expires → Redirect to login
  - Preserve return URL after login

  ---
  Phase 10: Testing & Documentation (20 min)

  10.1 Manual Testing Checklist
  - Login works with correct password
  - Login fails with incorrect password
  - Briefs list loads from Airtable
  - Table shows all columns correctly
  - Approve dialog shows brief details
  - Approve triggers Job Pulse API
  - Reject dialog requires reason selection
  - Reject triggers Job Pulse API
  - Detail page shows YAML correctly
  - Copy button works
  - Polling updates list every 15s
  - Status badges update correctly
  - Error handling works (test with invalid job ID)

  10.2 Create README.md
  Include:
  - Setup instructions
  - Environment variables
  - Development commands
  - Deployment guide

  10.3 Update CLAUDE.md
  - Add any project-specific patterns discovered
  - Document any deviations from original plan

  ---
  Success Criteria

  ✅ Login page with password + name authentication
  ✅ Dashboard with sidebar navigation showing "Build Dashboard"
  ✅ Briefs table with all specified columns
  ✅ Approve dialog with full brief preview
  ✅ Reject dialog with predefined reasons + custom text
  ✅ Brief detail page with formatted YAML + copy button
  ✅ 15-second polling for automatic updates
  ✅ Status badges showing pending/building/complete/failed
  ✅ Error handling for all API failures
  ✅ Responsive design (desktop + mobile)
  ✅ Clean, unique UI using shadcn/ui

  ---
  Important Reminders

  🚫 NEVER call Ralph API directly - Always go through Job Pulse
  🎨 Use shadcn/ui components - Don't create custom components from scratch
  ⚡ Server Components by default - Only use "use client" when necessary
  🔒 Server-side Airtable calls - Never expose API keys to client
  📝 Follow CLAUDE.md patterns - Reference it throughout build
  🧪 Test each phase - Verify functionality before moving to next phase

  ---
  Environment Variables Needed

  Ask the user for these values before starting:
  AIRTABLE_API_KEY=
  AIRTABLE_BASE_ID=
  NEXT_PUBLIC_JOB_PULSE_URL=
  ADMIN_PASSWORD=

  ---
  Ready to build? Confirm you have the environment variables, then proceed through each phase sequentially. Test thoroughly at each
  phase before moving forward.