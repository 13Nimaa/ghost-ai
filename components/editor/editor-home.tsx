"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export function EditorHome({ onNewProject }: { onNewProject: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-xl font-medium text-copy-primary">
        Create a project or open an existing one
      </h1>
      <p className="max-w-sm text-sm text-copy-muted">
        Start a new architecture workspace, or choose a project from the
        sidebar.
      </p>
      <Button
        onClick={onNewProject}
        className="bg-accent-dim text-brand hover:bg-brand/20"
      >
        <Plus />
        New Project
      </Button>
    </div>
  )
}
