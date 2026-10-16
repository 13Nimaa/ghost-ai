"use client"

import { useState } from "react"

import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectDialogs } from "@/components/editor/use-project-dialogs"

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const dialogs = useProjectDialogs()

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
          onCreate={dialogs.openCreate}
          onRename={dialogs.openRename}
          onDelete={dialogs.openDelete}
        />
        <EditorHome onNewProject={dialogs.openCreate} />
      </main>
      <ProjectDialogs dialogs={dialogs} />
    </div>
  )
}
