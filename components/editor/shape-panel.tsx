import { useRef, type DragEvent } from "react"
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
import { CanvasShapeVisual } from "@/components/editor/canvas-shape"
import { cn } from "@/lib/utils"
import {
  DEFAULT_NODE_COLOR,
  SHAPE_DEFAULT_SIZES,
  type CanvasShape,
} from "@/types/canvas"

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

interface ShapePanelProps {
  selectedShape: CanvasShape | null
  onSelectedShapeChange: (shape: CanvasShape | null) => void
}

export function ShapePanel({
  selectedShape,
  onSelectedShapeChange,
}: ShapePanelProps) {
  const previewElements = useRef<
    Partial<Record<CanvasShape, HTMLDivElement | null>>
  >({})

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    shape: CanvasShape,
  ) {
    const payload = createShapeDragPayload(shape)

    event.dataTransfer.effectAllowed = "copy"
    event.dataTransfer.setData(
      CANVAS_SHAPE_DRAG_TYPE,
      JSON.stringify(payload),
    )

    const previewElement = previewElements.current[shape]

    if (previewElement) {
      event.dataTransfer.setDragImage(
        previewElement,
        payload.size.width / 2,
        payload.size.height / 2,
      )
    }
  }

  function handleSelect(shape: CanvasShape) {
    onSelectedShapeChange(selectedShape === shape ? null : shape)
  }

  return (
    <>
      <div
        aria-label="Canvas shapes"
        className="flex items-center gap-1 rounded-full border border-surface-border bg-elevated/95 p-1.5 shadow-lg backdrop-blur"
        role="toolbar"
      >
        {SHAPE_OPTIONS.map(({ shape, label, icon: Icon }) => {
          const isSelected = selectedShape === shape

          return (
            <button
              key={shape}
              type="button"
              draggable
              onClick={() => handleSelect(shape)}
              onDragStart={(event) => handleDragStart(event, shape)}
              className={cn(
                "flex h-10 w-10 cursor-grab items-center justify-center rounded-full transition-colors active:cursor-grabbing",
                isSelected
                  ? "bg-accent-dim text-brand"
                  : "text-copy-muted hover:bg-subtle hover:text-copy-primary",
              )}
              aria-label={isSelected ? `${label} selected` : `Select ${label}`}
              aria-pressed={isSelected}
              title={label}
            >
              <Icon className="h-5 w-5" />
            </button>
          )
        })}
      </div>
      <div aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0">
        {SHAPE_OPTIONS.map(({ shape }) => {
          const size = SHAPE_DEFAULT_SIZES[shape]

          return (
            <div
              key={shape}
              ref={(element) => {
                previewElements.current[shape] = element
              }}
              className="mb-4 opacity-75 drop-shadow-2xl"
              style={{ height: size.height, width: size.width }}
            >
              <CanvasShapeVisual
                color={DEFAULT_NODE_COLOR.fill}
                shape={shape}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
