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

export function ShapePanel() {
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

  return (
    <>
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
