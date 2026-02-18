import {
  Send,
  CheckCircle,
  Flame,
  CalendarClock,
  Handshake,
  Activity,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  group: string
  items: NavItem[]
}

export const NAV_ITEMS: NavGroup[] = [
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
      { href: '/follow-ups', label: 'Follow Ups', icon: CalendarClock },
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
