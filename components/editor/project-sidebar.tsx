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
import { useUser } from "@clerk/nextjs"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ProjectListItem } from "@/lib/projects"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: ProjectListItem[]
  sharedProjects: ProjectListItem[]
  activeProjectId?: string
  onCreate: () => void
  onRename: (project: ProjectListItem) => void
  onDelete: (project: ProjectListItem) => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  onCreate,
  onRename,
  onDelete,
}: ProjectSidebarProps) {
  const { user } = useUser()
  const avatarInitial = (
    user?.firstName?.[0] ??
    user?.emailAddresses[0]?.emailAddress?.[0] ??
    "?"
  ).toUpperCase()

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
          "fixed bottom-2 left-2 top-16 z-40 flex w-72 flex-col rounded-2xl border border-surface-border bg-surface/95 backdrop-blur-sm transition-transform duration-300 ease-out",
          isOpen
            ? "translate-x-0"
            : "pointer-events-none -translate-x-full"
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
            <TabsList className="h-9 w-full rounded-full border border-subtle-border bg-elevated p-1">
              <TabsTrigger
                value="my-projects"
                className="rounded-full px-3 text-xs font-medium text-copy-muted data-active:bg-surface data-active:text-copy-primary"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="rounded-full px-3 text-xs font-medium text-copy-muted data-active:bg-surface data-active:text-copy-primary"
              >
                Shared
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <TabsContent value="my-projects" className="p-4">
              {ownedProjects.length === 0 ? (
                <EmptyPlaceholder icon={FolderOpen} label="No projects yet" />
              ) : (
                <ul className="flex flex-col gap-1">
                  {ownedProjects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      owned
                      isActive={project.id === activeProjectId}
                      onRename={onRename}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="shared" className="p-4">
              {sharedProjects.length === 0 ? (
                <EmptyPlaceholder icon={Users} label="No shared projects" />
              ) : (
                <ul className="flex flex-col gap-1">
                  {sharedProjects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      owned={false}
                      isActive={project.id === activeProjectId}
                      onRename={onRename}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
          </ScrollArea>

        </Tabs>

        <div className="flex items-center gap-2 border-t border-surface-border p-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-surface-border bg-elevated text-sm font-medium text-copy-secondary"
          >
            {avatarInitial}
          </span>
          <Button
            onClick={onCreate}
            className="h-9 flex-1 rounded-full bg-brand text-on-brand hover:bg-brand/90"
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
  isActive,
  onRename,
  onDelete,
}: {
  project: ProjectListItem
  owned: boolean
  isActive: boolean
  onRename: (project: ProjectListItem) => void
  onDelete: (project: ProjectListItem) => void
}) {
  return (
    <li
      className={cn(
        "group flex items-center gap-1 rounded-xl px-3 py-2",
        isActive ? "bg-accent-dim" : "hover:bg-subtle"
      )}
    >
      {isActive ? (
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
        />
      ) : null}
      <Link
        href={`/editor/${project.id}`}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          isActive ? "font-medium text-copy-primary" : "text-copy-primary"
        )}
      >
        {project.name}
      </Link>
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
