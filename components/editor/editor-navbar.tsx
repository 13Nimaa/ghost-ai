"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-surface px-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-pressed={isSidebarOpen}
          className="text-copy-muted hover:text-copy-primary"
        >
          {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </div>

      <div className="flex items-center gap-2" />

      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  )
}
