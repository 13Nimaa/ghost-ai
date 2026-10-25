"use client"

import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { CanvasSaveStatusIndicator } from "@/components/editor/canvas-save-status"
import { Button } from "@/components/ui/button"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  projectName?: string
  isAiPanelOpen?: boolean
  onToggleAiPanel?: () => void
  onShare?: () => void
  onOpenTemplates?: () => void
  showUserButton?: boolean
  saveStatus?: CanvasSaveStatus
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  isAiPanelOpen,
  onToggleAiPanel,
  onShare,
  onOpenTemplates,
  showUserButton = true,
  saveStatus = "idle",
}: EditorNavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-base px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
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
        {projectName ? (
          <div className="flex min-w-0 flex-col justify-center">
            <span className="min-w-0 truncate text-sm font-medium leading-tight text-copy-primary">
              {projectName}
            </span>
            <span className="text-xs leading-tight text-copy-muted">
              Workspace
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2" />

      <div className="flex flex-none items-center gap-2">
        <CanvasSaveStatusIndicator status={saveStatus} />
        {onOpenTemplates ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTemplates}
            aria-label="Open starter templates"
            className="rounded-full border-surface-border bg-elevated text-copy-primary hover:bg-subtle"
          >
            <LayoutTemplate />
            Templates
          </Button>
        ) : null}
        {onShare ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            aria-label="Share project"
            className="rounded-full border-surface-border bg-elevated text-copy-primary hover:bg-subtle"
          >
            <Share2 />
            Share
          </Button>
        ) : null}
        {onToggleAiPanel ? (
          <Button
            size="sm"
            onClick={onToggleAiPanel}
            aria-label={isAiPanelOpen ? "Close AI sidebar" : "Open AI sidebar"}
            aria-pressed={isAiPanelOpen}
            className="rounded-full bg-brand text-on-brand hover:bg-brand/90"
          >
            <Sparkles />
            AI
          </Button>
        ) : null}
        {showUserButton ? <UserButton /> : null}
      </div>
    </header>
  )
}
