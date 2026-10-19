import type { DragEvent } from "react"
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react"

import {
  CANVAS_SHAPE_DRAG_TYPE,
  createShapeDragPayload,
} from "@/lib/canvas-drag"
import type { CanvasShape } from "@/types/canvas"

interface ShapeOption {
  shape: CanvasShape
  label: string
  icon: LucideIcon
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { shape: "rectangle", label: "Rectangle", icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", icon: Diamond },
  { shape: "circle", label: "Circle", icon: Circle },
  { shape: "pill", label: "Pill", icon: Pill },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon },
]

export function ShapePanel() {
  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    shape: CanvasShape,
  ) {
    event.dataTransfer.effectAllowed = "copy"
    event.dataTransfer.setData(
      CANVAS_SHAPE_DRAG_TYPE,
      JSON.stringify(createShapeDragPayload(shape)),
    )
  }

  return (
    <div
      aria-label="Canvas shapes"
      className="flex items-center gap-1 rounded-full border border-surface-border bg-elevated/95 p-1.5 shadow-lg backdrop-blur"
      role="toolbar"
    >
      {SHAPE_OPTIONS.map(({ shape, label, icon: Icon }) => (
        <button
          key={shape}
          type="button"
          draggable
          onDragStart={(event) => handleDragStart(event, shape)}
          className="flex h-10 w-10 cursor-grab items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
          aria-label={`Drag ${label}`}
          title={label}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  )
}
