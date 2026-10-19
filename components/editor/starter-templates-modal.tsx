"use client"

import { Download } from "lucide-react"

import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SHAPE_DEFAULT_SIZES, type CanvasNode } from "@/types/canvas"

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-3xl border border-surface-border bg-elevated p-0 text-copy-primary shadow-2xl sm:max-w-6xl">
        <DialogHeader className="gap-2 px-6 pb-5 pt-6 sm:px-8 sm:pt-7">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-copy-primary">
            Import Template
          </DialogTitle>
          <DialogDescription className="max-w-3xl leading-relaxed text-copy-muted">
            Choose a starter template to pre-populate your canvas. Existing
            nodes and edges will be replaced, and the import can be undone.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-fit px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <article
                className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface"
                key={template.id}
              >
                <TemplatePreview template={template} />
                <div className="flex flex-1 flex-col border-t border-surface-border p-5">
                  <h3 className="font-heading text-base font-semibold text-copy-primary">
                    {template.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-copy-muted">
                    {template.description}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 w-full rounded-xl border-subtle-border bg-elevated text-copy-primary hover:bg-subtle"
                    onClick={() => handleImport(template)}
                    aria-label={`Import ${template.name} template`}
                  >
                    <Download />
                    Import
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const bounds = getTemplateBounds(template.nodes)
  const padding = Math.max(bounds.width, bounds.height) * 0.08 + 20

  return (
    <div className="h-52 w-full bg-base p-4" aria-hidden="true">
      <svg
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`}
      >
        <g
          fill="none"
          stroke="var(--border-subtle)"
          strokeLinecap="round"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        >
          {template.edges.map((edge) => {
            const source = template.nodes.find((node) => node.id === edge.source)
            const target = template.nodes.find((node) => node.id === edge.target)

            if (!source || !target) {
              return null
            }

            const sourceCenter = getNodeCenter(source)
            const targetCenter = getNodeCenter(target)

            return (
              <line
                key={edge.id}
                x1={sourceCenter.x}
                y1={sourceCenter.y}
                x2={targetCenter.x}
                y2={targetCenter.y}
              />
            )
          })}
        </g>

        {template.nodes.map((node) => (
          <PreviewNode key={node.id} node={node} />
        ))}
      </svg>
    </div>
  )
}

function PreviewNode({ node }: { node: CanvasNode }) {
  const { width, height } = getNodeSize(node)
  const { x, y } = node.position
  const fill = node.data.color
  const stroke = "var(--border-default)"
  const strokeWidth = 2
  const shape = node.data.shape

  return (
    <g transform={`translate(${x} ${y})`}>
      {shape === "rectangle" || shape === "pill" ? (
        <rect
          fill={fill}
          height={height}
          rx={shape === "pill" ? height / 2 : 16}
          stroke={stroke}
          strokeWidth={strokeWidth}
          width={width}
        />
      ) : null}
      {shape === "circle" ? (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          fill={fill}
          rx={width / 2}
          ry={height / 2}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ) : null}
      {shape === "diamond" ? (
        <polygon
          fill={fill}
          points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ) : null}
      {shape === "hexagon" ? (
        <polygon
          fill={fill}
          points={`${width * 0.25},0 ${width * 0.75},0 ${width},${height / 2} ${width * 0.75},${height} ${width * 0.25},${height} 0,${height / 2}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ) : null}
      {shape === "cylinder" ? (
        <>
          <path
            d={`M0 ${height * 0.14} C0 0 ${width} 0 ${width} ${height * 0.14} V${height * 0.86} C${width} ${height} 0 ${height} 0 ${height * 0.86} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <ellipse
            cx={width / 2}
            cy={height * 0.14}
            fill={fill}
            rx={width / 2}
            ry={height * 0.14}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </>
      ) : null}
    </g>
  )
}

function getNodeSize(node: CanvasNode) {
  const fallback = SHAPE_DEFAULT_SIZES[node.data.shape]

  return {
    width: node.width ?? fallback.width,
    height: node.height ?? fallback.height,
  }
}

function getNodeCenter(node: CanvasNode) {
  const size = getNodeSize(node)

  return {
    x: node.position.x + size.width / 2,
    y: node.position.y + size.height / 2,
  }
}

function getTemplateBounds(nodes: CanvasNode[]) {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 1, height: 1 }
  }

  const minX = Math.min(...nodes.map((node) => node.position.x))
  const minY = Math.min(...nodes.map((node) => node.position.y))
  const maxX = Math.max(
    ...nodes.map((node) => node.position.x + getNodeSize(node).width),
  )
  const maxY = Math.max(
    ...nodes.map((node) => node.position.y + getNodeSize(node).height),
  )

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  }
}
