"use client"

import { Bot, X } from "lucide-react"
import { ClientSideSuspense } from "@liveblocks/react/suspense"

import { AiArchitectPanel } from "@/components/editor/ai-architect-panel"
import { AiSpecsPanel } from "@/components/editor/ai-specs-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
}

function AiSidebarSkeleton({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <aside
      aria-hidden={!isOpen}
      aria-label="AI Workspace"
      className={cn(
        "fixed bottom-2 right-2 top-16 z-40 flex w-96 max-w-[calc(100vw-1rem)] flex-col rounded-2xl border border-surface-border bg-surface/95 backdrop-blur-sm transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-surface-border px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text"
          >
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-medium text-copy-primary">
              AI Workspace
            </h2>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="shrink-0 text-copy-muted hover:text-copy-primary"
        >
          <X />
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 text-xs text-copy-muted">
        Connecting to collaborative session…
      </div>
    </aside>
  )
}

function AiSidebarInner({
  isOpen,
  onClose,
  roomId,
}: AiSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      aria-label="AI Workspace"
      className={cn(
        "fixed bottom-2 right-2 top-16 z-40 flex w-96 max-w-[calc(100vw-1rem)] flex-col rounded-2xl border border-surface-border bg-surface/95 backdrop-blur-sm transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-surface-border px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text"
          >
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-medium text-copy-primary">
              AI Workspace
            </h2>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="shrink-0 text-copy-muted hover:text-copy-primary"
        >
          <X />
        </Button>
      </div>

      <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0">
        <div className="px-4 pt-3">
          <TabsList className="h-9 w-full rounded-full border border-subtle-border bg-elevated p-1">
            <TabsTrigger
              value="architect"
              className="rounded-full px-3 text-xs font-medium text-copy-muted dark:text-copy-muted data-active:border-ai/30 data-active:bg-ai/15 data-active:text-ai-text dark:data-active:border-ai/30 dark:data-active:bg-ai/15 dark:data-active:text-ai-text"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-full px-3 text-xs font-medium text-copy-muted dark:text-copy-muted data-active:border-ai/30 data-active:bg-ai/15 data-active:text-ai-text dark:data-active:border-ai/30 dark:data-active:bg-ai/15 dark:data-active:text-ai-text"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="flex min-h-0 flex-1 flex-col pt-3"
        >
          <AiArchitectPanel roomId={roomId} />
        </TabsContent>
        <TabsContent
          value="specs"
          className="flex min-h-0 flex-1 flex-col pt-3"
        >
          <AiSpecsPanel projectId={roomId} />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

export function AiSidebar(props: AiSidebarProps) {
  return (
    <ClientSideSuspense
      fallback={
        props.isOpen ? (
          <AiSidebarSkeleton isOpen={props.isOpen} onClose={props.onClose} />
        ) : null
      }
    >
      <AiSidebarInner {...props} />
    </ClientSideSuspense>
  )
}
