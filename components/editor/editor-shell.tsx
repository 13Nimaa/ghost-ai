"use client"

import { useState, type ReactNode } from "react"

import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectListItem } from "@/lib/projects"

interface EditorShellProps {
  ownedProjects: ProjectListItem[]
  sharedProjects: ProjectListItem[]
  activeProjectId?: string
  children?: ReactNode
}

export function EditorShell({
  ownedProjects,
  sharedProjects,
  activeProjectId,
  children,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const actions = useProjectActions({ activeProjectId })

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <main className="relative flex-1">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onCreate={actions.openCreate}
          onRename={actions.openRename}
          onDelete={actions.openDelete}
        />
        {children ?? <EditorHome onNewProject={actions.openCreate} />}
      </main>
      <ProjectDialogs dialogs={actions} />
    </div>
  )
}
