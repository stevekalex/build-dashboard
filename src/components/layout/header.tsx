'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface HeaderProps {
  userName: string
}

export function Header({ userName }: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-3 py-2 md:px-6 md:py-4">
      <div className="flex items-center justify-between">
        <div className="text-xs md:text-sm text-gray-600">
          <span className="hidden sm:inline">Logged in as: </span>
          <span className="font-medium text-gray-900">{userName}</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs md:text-sm">
          <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          Logout
        </Button>
      </div>
    </header>
  )
}
