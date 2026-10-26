"use client"

import type { Components } from "react-markdown"
import Markdown from "react-markdown"
import { Download, FileText, Loader2, Sparkles } from "lucide-react"

import { EditorDialog } from "@/components/editor/editor-dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAiPresenceState } from "@/hooks/use-ai-presence-state"
import { useGenerateSpec } from "@/hooks/use-generate-spec"
import { useProjectSpecs } from "@/hooks/use-project-specs"
import {
  formatSpecCreatedAt,
  type ProjectSpecListItem,
} from "@/lib/specs"

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 text-lg font-semibold text-copy-primary">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 text-base font-semibold text-copy-primary">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-sm font-semibold text-copy-primary">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-copy-secondary">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-copy-secondary">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-copy-secondary">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="rounded-md bg-subtle px-1.5 py-0.5 font-mono text-[0.8em] text-copy-primary">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-surface-border bg-subtle p-3 font-mono text-xs text-copy-primary">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-brand underline-offset-2 hover:underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-copy-primary">{children}</strong>
  ),
  hr: () => <hr className="my-4 border-surface-border" />,
}

export function AiSpecsPanel({ projectId }: { projectId: string }) {
  const { isAiActive } = useAiPresenceState()
  const {
    specs,
    isLoading,
    error,
    selectedSpec,
    previewContent,
    isPreviewLoading,
    previewError,
    openPreview,
    closePreview,
    downloadSpec,
    refresh,
  } = useProjectSpecs(projectId)
  const {
    isGenerating,
    error: generateError,
    generate,
  } = useGenerateSpec(projectId, refresh)

  const isBusy = isAiActive || isGenerating

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4">
        <Button
          type="button"
          disabled={isBusy}
          onClick={() => {
            void generate()
          }}
          className="h-9 w-full rounded-xl bg-ai text-copy-primary hover:bg-ai/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles />
              Generate Spec
            </>
          )}
        </Button>
        <p className="mt-2 text-center text-xs text-copy-muted">
          Turn the current canvas into a Markdown spec.
        </p>
        {generateError ? (
          <p className="mt-2 text-center text-xs text-state-error">
            {generateError}
          </p>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 overflow-auto max-h-[400px] flex-1">
        <div className="space-y-3 p-4">
          {isLoading ? (
            <p className="py-8 text-center text-xs text-copy-muted">
              Loading specs…
            </p>
          ) : error ? (
            <p className="py-8 text-center text-xs text-state-error">{error}</p>
          ) : specs.length === 0 ? (
            <p className="py-8 text-center text-xs text-copy-muted">
              No specs yet. Generate one from the canvas.
            </p>
          ) : (
            specs.map((spec) => (
              <SpecListItem
                key={spec.id}
                spec={spec}
                onOpen={() => openPreview(spec)}
                onDownload={() => downloadSpec(spec)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <EditorDialog
        open={selectedSpec !== null}
        onOpenChange={(open) => {
          if (!open) {
            closePreview()
          }
        }}
        title={selectedSpec?.filename ?? "Spec preview"}
        description={
          selectedSpec
            ? formatSpecCreatedAt(selectedSpec.createdAt)
            : undefined
        }
        className="flex max-h-[85vh] min-h-0 w-[min(42rem,calc(100vw-2rem))] flex-col gap-4 overflow-hidden sm:max-w-2xl"
        footer={
          selectedSpec ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => downloadSpec(selectedSpec)}
            >
              <Download />
              Download
            </Button>
          ) : null
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-surface-border bg-subtle/40">
          <div className="p-4">
            {isPreviewLoading ? (
              <p className="py-10 text-center text-sm text-copy-muted">
                Loading preview…
              </p>
            ) : previewError ? (
              <p className="py-10 text-center text-sm text-state-error">
                {previewError}
              </p>
            ) : previewContent ? (
              <Markdown components={markdownComponents}>
                {previewContent}
              </Markdown>
            ) : null}
          </div>
        </div>
      </EditorDialog>
    </div>
  )
}

function SpecListItem({
  spec,
  onOpen,
  onDownload,
}: {
  spec: ProjectSpecListItem
  onOpen: () => void
  onDownload: () => void
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-elevated p-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left outline-none transition-colors hover:bg-subtle/60 focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <span
            aria-hidden
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-subtle text-ai-text"
          >
            <FileText className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 py-0.5">
            <span className="block truncate text-sm font-medium text-copy-primary">
              {spec.filename}
            </span>
            <span className="mt-1 block text-[0.65rem] font-medium uppercase tracking-[0.16em] text-copy-faint">
              {formatSpecCreatedAt(spec.createdAt)}
            </span>
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Download ${spec.filename}`}
          className="shrink-0 text-copy-muted hover:text-copy-primary"
          onClick={onDownload}
        >
          <Download />
        </Button>
      </div>
    </div>
  )
}
