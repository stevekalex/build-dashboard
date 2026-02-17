'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Send,
  CheckCircle,
  Flame,
  CalendarClock,
  MailQuestion,
  Handshake,
  Activity,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    group: 'Inbox',
    items: [
      { href: '/approve', label: 'Approve', icon: CheckCircle },
      { href: '/ready-to-send', label: 'Ready to Send', icon: Send },
    ],
  },
  {
    group: 'Outreach',
    items: [
      { href: '/hot-leads', label: 'Hot Leads', icon: Flame },
      { href: '/follow-ups', label: 'Follow Ups Due', icon: CalendarClock },
      { href: '/awaiting', label: 'Awaiting Response', icon: MailQuestion },
    ],
  },
  {
    group: 'Closing',
    items: [
      { href: '/closing', label: 'Closing', icon: Handshake },
    ],
  },
  {
    group: 'Reports',
    items: [
      { href: '/pulse', label: 'Daily Pulse', icon: Activity },
      { href: '/pipeline', label: 'Pipeline', icon: BarChart3 },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">Ops Dashboard</h1>
      </div>
      <nav className="px-4 space-y-6">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm',
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
