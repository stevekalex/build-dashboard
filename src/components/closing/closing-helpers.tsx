import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function HelperCard({
  title,
  when,
  children,
}: {
  title: string
  when: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="px-5 py-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{when}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function Rule({ children }: { children: React.ReactNode }) {
  return <li className="text-xs text-gray-600">{children}</li>
}

export function ClosingHelpers() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Message 5: Client Question Response */}
      <HelperCard
        title="Message 5: Client Question Response"
        when="Client responds to proposal/follow-up with questions (via Upwork message)"
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-700">
            Answer directly, demonstrate competence, end with a clear path forward.
          </p>

          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">Key Rule</p>
            <p className="text-xs text-gray-600">
              Every response ends with either{' '}
              <span className="font-medium">&quot;happy to scope on a quick call&quot;</span> or{' '}
              <span className="font-medium">&quot;can start Monday.&quot;</span>{' '}
              Never answer a question and leave it hanging.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">Multi-Question Rule</p>
            <ol className="space-y-1 list-decimal list-inside">
              <Rule>Answer each question in order, 1-2 sentences per question</Rule>
              <Rule>Single line break between answers (no numbering, no headers)</Rule>
              <Rule>ONE path forward at the end — not one per question</Rule>
              <Rule>Total response capped at 5-7 lines</Rule>
            </ol>
          </div>

          <div className="bg-gray-50 rounded-md px-3 py-2">
            <p className="text-xs text-gray-500 mb-1">If too many questions:</p>
            <p className="text-xs text-gray-700 italic">
              &quot;A couple of these are easier to cover on a quick call — {'{neetocal_link}'}&quot;
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-800 mb-1.5">6 Response Categories</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs">Scope</Badge>
              <Badge variant="outline" className="text-xs">Timeline</Badge>
              <Badge variant="outline" className="text-xs">Process</Badge>
              <Badge variant="outline" className="text-xs">Technical</Badge>
              <Badge variant="outline" className="text-xs">Pricing</Badge>
              <Badge variant="outline" className="text-xs">Experience</Badge>
            </div>
          </div>
        </div>
      </HelperCard>

      {/* Message 6: NeetoCal Scheduling */}
      <HelperCard
        title="Message 6: NeetoCal Scheduling Message"
        when="Client indicates they want a call (directly asks or accepts call offer)"
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">Template</p>
            <div className="bg-gray-50 rounded-md px-3 py-2 font-mono text-xs text-gray-700 whitespace-pre-line">
              {`Here's my calendar. Grab whatever works:\n{neetocal_link}\n\nSlots are same-day and tomorrow. 15 minutes is plenty.`}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">Rules</p>
            <ul className="space-y-1 list-disc list-inside">
              <Rule>This is the ONLY content in the message — nothing else</Rule>
              <Rule>Same-day and next-day slots only — momentum dies over gaps</Rule>
              <Rule>&quot;15 minutes is plenty&quot; removes time commitment objection</Rule>
              <Rule>
                Send within <span className="font-medium">15 minutes</span> of their message
              </Rule>
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">Variable</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-mono">
                {'{neetocal_link}'}
              </Badge>
              <span className="text-xs text-gray-500">NeetoCal booking URL</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <p className="text-xs text-amber-800">
              No AI prompt needed. Copy-paste from template, insert link.
            </p>
          </div>
        </div>
      </HelperCard>

      {/* Closing Call Cues */}
      <HelperCard
        title="Closing Call Cues"
        when="During or preparing for a closing call with a client"
      >
        <div className="space-y-3">
          {/* Pre-call prep */}
          <div className="bg-gray-50 rounded-md px-3 py-2 space-y-0.5">
            <p className="text-xs font-medium text-gray-800">Pre-Call Prep</p>
            <p className="text-xs text-gray-600">Client &middot; Job Title &middot; Budget &middot; Prototype built &middot; Their priority &middot; Pre-call signals</p>
          </div>

          {/* Step 1 */}
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">1. Warm Anchor <span className="font-normal text-gray-500">(30-60s)</span></p>
            <p className="text-xs text-gray-700 italic">&quot;You saw the prototype — what stood out? Right track?&quot;</p>
            <p className="text-xs text-gray-500 mt-0.5">LISTEN: what they say first = their priority</p>
          </div>

          {/* Step 2 */}
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">2. Objection Surface <span className="font-normal text-gray-500">(1-2 min)</span></p>
            <p className="text-xs text-gray-700 italic">&quot;What&apos;s the main thing you&apos;d want to understand before we get started?&quot;</p>
            <ul className="space-y-0.5 list-disc list-inside mt-1">
              <Rule>Address directly in 2-3 sentences (use response library)</Rule>
              <Rule>If 3+ objections — they&apos;re not ready, send milestones, follow up in 48hrs</Rule>
            </ul>
          </div>

          {/* Step 3 */}
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">3. Milestones <span className="font-normal text-gray-500">(2-3 min)</span></p>
            <div className="space-y-1 text-xs text-gray-700">
              <p><span className="font-medium">M1:</span> Production-ready prototype — prototype rebuilt with real data, proper error handling, deployed</p>
              <p><span className="font-medium">M2:</span> Core features</p>
              <p><span className="font-medium">M3:</span> Polish + deploy</p>
            </div>
            <p className="text-xs text-gray-500 mt-1 italic">&quot;You see delivery quality on M1 before committing to the rest.&quot;</p>
          </div>

          {/* Step 4 */}
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">4. Close</p>
            <p className="text-xs text-gray-700 italic mb-1">&quot;Does that structure work?&quot;</p>
            <div className="space-y-1 text-xs">
              <p className="text-gray-600"><span className="font-medium text-green-700">YES:</span> &quot;Contract in your Upwork inbox within 30 min&quot;</p>
              <p className="text-gray-600"><span className="font-medium text-green-700">YES + keeps talking:</span> &quot;Let&apos;s nail that down in the build. Contract coming over now.&quot;</p>
              <p className="text-gray-600"><span className="font-medium text-amber-600">Needs approval:</span> &quot;I&apos;ll send it now so they can review&quot;</p>
              <p className="text-gray-600"><span className="font-medium text-gray-500">Hesitant:</span> &quot;I&apos;ll send milestones through, fund M1 when you&apos;re ready&quot;</p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2">
            <p className="text-xs font-medium text-green-800">5. Post-Call: Send contract within 30 minutes. No exceptions.</p>
          </div>

          {/* Quick rebuttals */}
          <div>
            <p className="text-xs font-medium text-gray-800 mb-1">Quick Rebuttals</p>
            <div className="space-y-1.5">
              <div>
                <Badge variant="outline" className="text-xs mb-0.5">Hourly rate?</Badge>
                <p className="text-xs text-gray-600">&quot;We price by milestone, not by hour — you&apos;re paying for delivered outcomes, not logged time.&quot;</p>
              </div>
              <div>
                <Badge variant="outline" className="text-xs mb-0.5">Different tech stack?</Badge>
                <p className="text-xs text-gray-600">&quot;We specialise exclusively in React/Next.js — it&apos;s how we deliver at this speed.&quot;</p>
              </div>
            </div>
          </div>

          {/* Hard stop */}
          <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2">
            <p className="text-xs text-red-800">
              <span className="font-medium">Hard stop: 15 minutes.</span> If not closed by then, offer to send milestones and follow up.
            </p>
          </div>
        </div>
      </HelperCard>
    </div>
  )
}
