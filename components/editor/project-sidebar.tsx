"use client"

import { FolderOpen, Plus, Users, X, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
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

      <Tabs
        defaultValue="my-projects"
        className="min-h-0 flex-1 gap-0"
      >
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="my-projects" className="p-4">
            <EmptyPlaceholder icon={FolderOpen} label="No projects yet" />
          </TabsContent>
          <TabsContent value="shared" className="p-4">
            <EmptyPlaceholder icon={Users} label="No shared projects" />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <div className="border-t border-surface-border p-4">
        <Button className="w-full bg-accent-dim text-brand hover:bg-brand/20">
          <Plus />
          New Project
        </Button>
      </div>
    </aside>
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
