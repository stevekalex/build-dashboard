'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface ClosingTabsProps {
  board: React.ReactNode
  helpers: React.ReactNode
}

export function ClosingTabs({ board, helpers }: ClosingTabsProps) {
  return (
    <Tabs defaultValue="board">
      <TabsList>
        <TabsTrigger value="board">Board</TabsTrigger>
        <TabsTrigger value="helpers">Helpers</TabsTrigger>
      </TabsList>
      <TabsContent value="board">{board}</TabsContent>
      <TabsContent value="helpers">{helpers}</TabsContent>
    </Tabs>
  )
}
