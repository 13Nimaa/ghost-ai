import {
  Maximize,
  Minus,
  Plus,
  Redo2,
  Undo2,
  type LucideIcon,
} from "lucide-react"
import type { ReactFlowInstance } from "@xyflow/react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const VIEWPORT_ANIMATION_DURATION = 200

interface CanvasControlBarProps {
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge> | null
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

interface ControlButtonProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
}

export function CanvasControlBar({
  reactFlow,
  canUndo,
  canRedo,
  undo,
  redo,
}: CanvasControlBarProps) {
  return (
    <div
      aria-label="Canvas controls"
      className="flex items-center gap-1 rounded-full border border-surface-border bg-elevated/95 p-1.5 shadow-lg backdrop-blur"
      role="toolbar"
    >
      <ControlButton
        label="Zoom out (-)"
        icon={Minus}
        onClick={() => {
          void reactFlow?.zoomOut({ duration: VIEWPORT_ANIMATION_DURATION })
        }}
      />
      <ControlButton
        label="Fit view"
        icon={Maximize}
        onClick={() => {
          void reactFlow?.fitView({
            duration: VIEWPORT_ANIMATION_DURATION,
            padding: 0.2,
          })
        }}
      />
      <ControlButton
        label="Zoom in (+)"
        icon={Plus}
        onClick={() => {
          void reactFlow?.zoomIn({ duration: VIEWPORT_ANIMATION_DURATION })
        }}
      />

      <div aria-hidden="true" className="mx-1 h-5 w-px bg-surface-border" />

      <ControlButton
        label="Undo (Ctrl or Command + Z)"
        icon={Undo2}
        onClick={undo}
        disabled={!canUndo}
      />
      <ControlButton
        label="Redo (Ctrl or Command + Shift + Z)"
        icon={Redo2}
        onClick={redo}
        disabled={!canRedo}
      />
    </div>
  )
}

function ControlButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full text-copy-muted transition-[color,background-color,opacity,transform] hover:bg-subtle hover:text-copy-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-copy-muted disabled:active:scale-100"
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
    </button>
  )
}
