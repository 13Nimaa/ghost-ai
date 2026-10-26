"use client"

import { useState } from "react"

import { AiSidebar } from "@/components/editor/ai-sidebar"
import { CollaborativeCanvas } from "@/components/editor/collaborative-canvas"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareDialog } from "@/hooks/use-share-dialog"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"
import type { ProjectListItem } from "@/lib/projects"

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
  const [canvasSaveStatus, setCanvasSaveStatus] =
    useState<CanvasSaveStatus>("idle")
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
        showUserButton={false}
        saveStatus={canvasSaveStatus}
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
          onSaveStatusChange={setCanvasSaveStatus}
        />
        <AiSidebar
          isOpen={isAiPanelOpen}
          onClose={() => setIsAiPanelOpen(false)}
          projectId={activeProjectId}
          roomId={activeProjectId}
        />
      </main>
      <ProjectDialogs dialogs={actions} />
      <ShareDialog controller={share} />
    </div>
  )
}

