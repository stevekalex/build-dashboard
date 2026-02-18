'use client'

import { Build } from '@/types/brief'
import { BuildColumn } from './build-column'

interface BuildKanbanProps {
  builds: Build[]
}

export function BuildKanban({ builds }: BuildKanbanProps) {
  // Group builds by stage
  const building = builds.filter((b) => b.stage === 'approved')
  const deployed = builds.filter((b) => b.stage === 'deployed')
  const failed = builds.filter((b) => b.stage === 'failed')

  return (
    <div className="w-full">
      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <BuildColumn title="Building" emoji="🔨" builds={building} accentColor="amber" tooltip="Build approved and in progress." />
        <BuildColumn title="Deployed" emoji="🚀" builds={deployed} accentColor="emerald" tooltip="Build completed and deployed." />
        <BuildColumn title="Failed" emoji="💥" builds={failed} accentColor="red" tooltip="Build failed with errors." />
      </div>

      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden overflow-x-auto pb-4 -mx-3 px-3">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          <BuildColumn title="Building" emoji="🔨" builds={building} accentColor="amber" tooltip="Build approved and in progress." />
          <BuildColumn title="Deployed" emoji="🚀" builds={deployed} accentColor="emerald" tooltip="Build completed and deployed." />
          <BuildColumn title="Failed" emoji="💥" builds={failed} accentColor="red" tooltip="Build failed with errors." />
        </div>
      </div>

      {/* Empty state */}
      {builds.length === 0 && (
        <div className="text-center py-16 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="space-y-2">
            <p className="text-lg font-medium">No builds yet</p>
            <p className="text-sm text-gray-400">Approved builds will appear here</p>
          </div>
        </div>
      )}
    </div>
  )
}
