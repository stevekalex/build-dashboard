'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Build Dashboard</h1>
      </div>
      <nav className="px-4 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Briefs</span>
        </Link>
      </nav>
    </aside>
  )
}
