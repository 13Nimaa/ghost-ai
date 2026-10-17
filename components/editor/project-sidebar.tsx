"use client"

import {
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ownedMockProjects,
  sharedMockProjects,
  type MockProject,
} from "@/components/editor/use-project-dialogs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  onCreate: () => void
  onRename: (project: MockProject) => void
  onDelete: (project: MockProject) => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      ) : null}
      <aside
        aria-hidden={!isOpen}
        className={cn(
          "fixed bottom-0 left-0 top-14 z-40 flex w-72 flex-col rounded-r-2xl border-r border-surface-border bg-surface/95 backdrop-blur-sm transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="font-heading text-sm font-medium text-copy-primary">
            Projects
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-copy-muted hover:text-copy-primary"
          >
            <X />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="min-h-0 flex-1 gap-0">
          <div className="px-4 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects">My Projects</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <TabsContent value="my-projects" className="p-4">
              {ownedMockProjects.length === 0 ? (
                <EmptyPlaceholder icon={FolderOpen} label="No projects yet" />
              ) : (
                <ul className="flex flex-col gap-1">
                  {ownedMockProjects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      owned
                      onRename={onRename}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="shared" className="p-4">
              {sharedMockProjects.length === 0 ? (
                <EmptyPlaceholder icon={Users} label="No shared projects" />
              ) : (
                <ul className="flex flex-col gap-1">
                  {sharedMockProjects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      owned={false}
                      onRename={onRename}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="border-t border-surface-border p-4">
          <Button
            onClick={onCreate}
            className="w-full bg-accent-dim text-brand hover:bg-brand/20"
          >
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

function ProjectRow({
  project,
  owned,
  onRename,
  onDelete,
}: {
  project: MockProject
  owned: boolean
  onRename: (project: MockProject) => void
  onDelete: (project: MockProject) => void
}) {
  return (
    <li className="group flex items-center gap-1 rounded-xl px-3 py-2 hover:bg-subtle">
      <span className="min-w-0 flex-1 truncate text-sm text-copy-primary">
        {project.name}
      </span>
      {owned ? (
        <span className="flex shrink-0 items-center md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Rename ${project.name}`}
            onClick={() => onRename(project)}
            className="text-copy-muted hover:text-copy-primary"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${project.name}`}
            onClick={() => onDelete(project)}
            className="text-copy-muted hover:text-copy-primary"
          >
            <Trash2 />
          </Button>
        </span>
      ) : null}
    </li>
  )
}

function EmptyPlaceholder({
  icon: Icon,
  label,
}: {
  icon: LucideIcon
  label: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon className="h-8 w-8 text-copy-faint" />
      <p className="text-sm text-copy-muted">{label}</p>
    </div>
  )
}
