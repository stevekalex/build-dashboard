import { getReadyToSend } from '@/lib/queries/ready-to-send'
import { SendQueue } from '@/components/ready-to-send/send-queue'

export const revalidate = 15

export default async function ReadyToSendPage() {
  const jobs = await getReadyToSend()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-3xl font-bold text-gray-900">Ready to Send</h1>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Record Loom and send applications
        </p>
      </div>
      <SendQueue jobs={jobs} />
    </div>
  )
}
