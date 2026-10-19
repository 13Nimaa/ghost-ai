import type { NodeProps } from "@xyflow/react"

import { DEFAULT_NODE_COLOR, type CanvasNode } from "@/types/canvas"

export function CanvasNodeRenderer({ data }: NodeProps<CanvasNode>) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-xl border border-subtle-border px-3 text-center text-sm"
      style={{ backgroundColor: data.color, color: DEFAULT_NODE_COLOR.text }}
    >
      {data.label}
    </div>
  )
}
