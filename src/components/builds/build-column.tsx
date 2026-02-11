'use client'

import { Build } from '@/types/brief'
import { BuildCard } from './build-card'

interface BuildColumnProps {
  title: string
  emoji: string
  builds: Build[]
  accentColor: 'amber' | 'emerald' | 'red'
}

export function BuildColumn({ title, emoji, builds, accentColor }: BuildColumnProps) {
  const colorClasses = {
    amber: {
      header: 'bg-amber-50 border-amber-200',
      count: 'bg-amber-100 text-amber-700',
      border: 'border-amber-100',
    },
    emerald: {
      header: 'bg-emerald-50 border-emerald-200',
      count: 'bg-emerald-100 text-emerald-700',
      border: 'border-emerald-100',
    },
    red: {
      header: 'bg-red-50 border-red-200',
      count: 'bg-red-100 text-red-700',
      border: 'border-red-100',
    },
  }

  const colors = colorClasses[accentColor]

  return (
    <div className="flex flex-col min-w-[280px] md:min-w-0">
      {/* Column Header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-lg border ${colors.header}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.count}`}>
          {builds.length}
        </span>
      </div>

      {/* Column Content */}
      <div
        className={`flex-1 p-2 space-y-2 bg-gray-50/50 border-x border-b rounded-b-lg ${colors.border} min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto`}
      >
        {builds.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No builds
          </div>
        ) : (
          builds.map((build) => <BuildCard key={build.id} build={build} />)
        )}
      </div>
    </div>
  )
}
