import { getReadyToSend } from '@/lib/queries/ready-to-send'
import { SendQueue } from '@/components/ready-to-send/send-queue'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'


export default async function ReadyToSendPage() {
  'use cache'
  const jobs = await getReadyToSend()
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Ready to Send</h1>
          <PageInfoTooltip
            content="Prototypes ready for you to send. Record a Loom, copy the cover letter, and submit on Upwork."
            filter="Stage is 'Deployed' or 'Prototype Built' and Applied At is empty."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Record Loom and send applications
        </p>
      </div>
      <SendQueue jobs={jobs} />
    </div>
  )
}
