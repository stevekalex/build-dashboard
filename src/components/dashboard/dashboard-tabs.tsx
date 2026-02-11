'use client'

import { useState } from 'react'
import { Brief, Build } from '@/types/brief'
import { BriefsListResponsive } from '@/components/briefs/briefs-list-responsive'
import { BuildKanban } from '@/components/builds/build-kanban'
import { ClipboardList, Layers } from 'lucide-react'

interface DashboardTabsProps {
  briefs: Brief[]
  builds: Build[]
}

type Tab = 'pending' | 'history'

export function DashboardTabs({ briefs, builds }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('pending')

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <TabButton
          active={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
          icon={<ClipboardList className="w-4 h-4" />}
          label="Pending Approval"
          count={briefs.length}
        />
        <TabButton
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          icon={<Layers className="w-4 h-4" />}
          label="Build History"
          count={builds.length}
        />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'pending' && <BriefsListResponsive briefs={briefs} />}
        {activeTab === 'history' && <BuildKanban builds={builds} />}
      </div>
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
}

function TabButton({ active, onClick, icon, label, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
        ${active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span
        className={`
          px-1.5 py-0.5 rounded-full text-xs font-medium
          ${active ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}
        `}
      >
        {count}
      </span>
    </button>
  )
}
