"use client"

import { useState } from "react"
import { Bot, Sparkles } from "lucide-react"

import { CollaborativeCanvas } from "@/components/editor/collaborative-canvas"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareDialog } from "@/hooks/use-share-dialog"
import type { ProjectListItem } from "@/lib/projects"
import { cn } from "@/lib/utils"

interface EditorWorkspaceProps {
  projectName: string
  activeProjectId: string
  isOwner: boolean
  ownedProjects: ProjectListItem[]
  sharedProjects: ProjectListItem[]
}

export function EditorWorkspace({
  projectName,
  activeProjectId,
  isOwner,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const actions = useProjectActions({ activeProjectId })
  const share = useShareDialog({
    projectId: activeProjectId,
    initialIsOwner: isOwner,
  })

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        projectName={projectName}
        isAiPanelOpen={isAiPanelOpen}
        onToggleAiPanel={() => setIsAiPanelOpen((open) => !open)}
        onShare={share.open}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
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
        <CollaborativeCanvas
          roomId={activeProjectId}
          isTemplatesOpen={isTemplatesOpen}
          onTemplatesOpenChange={setIsTemplatesOpen}
        />
        <AiPanelPlaceholder isOpen={isAiPanelOpen} />
      </main>
      <ProjectDialogs dialogs={actions} />
      <ShareDialog controller={share} />
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
