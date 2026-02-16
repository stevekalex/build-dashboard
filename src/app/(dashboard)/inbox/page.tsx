import { getHotLeads, getAwaitingResponse, getFollowUpsDue } from '@/lib/queries/inbox'
import { InboxView } from '@/components/inbox/inbox-view'

export const revalidate = 15

export default async function InboxPage() {
  const [hotLeads, awaitingResponse, followUpsDue] = await Promise.all([
    getHotLeads(),
    getAwaitingResponse(),
    getFollowUpsDue(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-3xl font-bold text-gray-900">Inbox</h1>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Your daily Upwork overview
        </p>
      </div>
      <InboxView
        hotLeads={hotLeads}
        awaitingResponse={awaitingResponse}
        followUpsDue={followUpsDue}
      />
    </div>
  )
}
