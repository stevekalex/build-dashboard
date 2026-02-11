import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get session from cookies
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  let userName = 'Guest'

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value)
      userName = session.name || 'Guest'
    } catch (error) {
      // Invalid session, will be handled by middleware
      userName = 'Guest'
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header userName={userName} />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
