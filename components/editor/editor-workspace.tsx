"use client"

import { useState, type CSSProperties } from "react"
import { Bot, Compass, Sparkles } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectListItem } from "@/lib/projects"
import { cn } from "@/lib/utils"

interface EditorWorkspaceProps {
  projectName: string
  activeProjectId: string
  ownedProjects: ProjectListItem[]
  sharedProjects: ProjectListItem[]
}

export function EditorWorkspace({
  projectName,
  activeProjectId,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false)
  const actions = useProjectActions({ activeProjectId })

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        projectName={projectName}
        isAiPanelOpen={isAiPanelOpen}
        onToggleAiPanel={() => setIsAiPanelOpen((open) => !open)}
      />
      <main className="relative flex-1">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={activeProjectId}
          onCreate={actions.openCreate}
          onRename={actions.openRename}
          onDelete={actions.openDelete}
        />
        <CanvasPlaceholder />
        <AiPanelPlaceholder isOpen={isAiPanelOpen} />
      </main>
      <ProjectDialogs dialogs={actions} />
    </div>
  )
}

const CANVAS_GRID_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, color-mix(in oklab, var(--border-default) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border-default) 55%, transparent) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
}

const CANVAS_GLOW_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(ellipse 55% 45% at 50% 30%, color-mix(in oklab, var(--accent-primary) 12%, transparent), transparent 70%)",
}

function CanvasPlaceholder() {
  return (
    <div className="h-full w-full p-2">
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-surface-border bg-surface px-6 text-center">
        <div aria-hidden className="absolute inset-0" style={CANVAS_GRID_STYLE} />
        <div aria-hidden className="absolute inset-0" style={CANVAS_GLOW_STYLE} />
        <div className="relative flex flex-col items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-subtle-border bg-elevated">
            <Compass className="h-6 w-6 text-brand" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-copy-faint">
            Workspace shell
          </p>
          <h1 className="max-w-xl font-heading text-2xl font-medium text-copy-primary md:text-3xl">
            Canvas and collaboration tooling land here next.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-copy-muted">
            This room is ready for the shared architecture canvas, durable AI
            workflows, and real-time presence. For now, the shell is wired with
            project context and navigation only.
          </p>
        </div>
      </div>
    </div>
  )
}

function AiPanelPlaceholder({ isOpen }: { isOpen: boolean }) {
  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "fixed bottom-2 right-2 top-16 z-40 flex w-96 max-w-[calc(100vw-1rem)] flex-col rounded-2xl border border-surface-border bg-surface transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
      )}
    >
      <div className="flex items-start justify-between border-b border-surface-border px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="font-heading text-sm font-medium text-copy-primary">
            AI Copilot
          </h2>
          <p className="text-xs text-copy-muted">Placeholder panel</p>
        </div>
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ai/15"
        >
          <Sparkles className="h-4 w-4 text-ai-text" />
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex items-start gap-3 rounded-2xl border border-subtle-border bg-elevated/50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
            <Bot />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-copy-primary">
              Chat surface pending
            </p>
            <p className="mt-1 text-sm leading-relaxed text-copy-muted">
              The toggle is wired. Messaging and generation are intentionally
              out of scope here.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <div className="rounded-2xl border border-subtle-border p-4">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-copy-faint">
            Future hooks
          </p>
          <p className="mt-2 text-sm leading-relaxed text-copy-muted">
            Prompt composer, run status, and architecture guidance will attach
            to this sidebar.
          </p>
        </div>
      </div>
    </aside>
  )
}
