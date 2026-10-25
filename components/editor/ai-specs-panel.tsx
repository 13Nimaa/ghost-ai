"use client"

import { Download, FileText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DemoSpec {
  title: string
  snippet: string
  meta: string
}

const DEMO_SPEC: DemoSpec = {
  title: "E-commerce Platform — Technical Spec",
  snippet:
    "Services, data stores, and request flows derived from the current canvas graph.",
  meta: "Markdown · Draft",
}

export function AiSpecsPanel() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4">
        <Button className="h-9 w-full rounded-xl bg-ai text-copy-primary hover:bg-ai/90">
          <Sparkles />
          Generate Spec
        </Button>
        <p className="mt-2 text-center text-xs text-copy-muted">
          Turn the current canvas into a Markdown spec.
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          <SpecCard spec={DEMO_SPEC} />
        </div>
      </ScrollArea>
    </div>
  )
}

function SpecCard({ spec }: { spec: DemoSpec }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-elevated p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-subtle text-ai-text"
        >
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-medium text-copy-primary">
              {spec.title}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled
              aria-label={`Download ${spec.title}`}
              className="shrink-0 text-copy-muted"
            >
              <Download />
            </Button>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-copy-muted">
            {spec.snippet}
          </p>
          <p className="mt-3 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-copy-faint">
            {spec.meta}
          </p>
        </div>
      </div>
    </div>
  )
}
