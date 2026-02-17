import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

async function HeaderWithSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  let userName = 'Guest'

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value)
      userName = session.name || 'Guest'
    } catch {
      userName = 'Guest'
    }
  }

  return <Header userName={userName} />
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Hide sidebar on mobile, show on desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<Header userName="Guest" />}>
          <HeaderWithSession />
        </Suspense>
        <main className="flex-1 p-3 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
