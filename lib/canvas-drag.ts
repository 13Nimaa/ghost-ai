import {
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  type CanvasShape,
  type ShapeDragPayload,
} from "@/types/canvas"

export const CANVAS_SHAPE_DRAG_TYPE = "application/x-ghost-canvas-shape"

export function createShapeDragPayload(shape: CanvasShape): ShapeDragPayload {
  return {
    shape,
    size: SHAPE_DEFAULT_SIZES[shape],
  }
}

export function parseShapeDragPayload(value: string): ShapeDragPayload | null {
  if (!value) {
    return null
  }

  try {
    const payload: unknown = JSON.parse(value)

    if (!isRecord(payload) || !isCanvasShape(payload.shape)) {
      return null
    }

    const { size } = payload

    if (
      !isRecord(size) ||
      !isPositiveNumber(size.width) ||
      !isPositiveNumber(size.height)
    ) {
      return null
    }

    return {
      shape: payload.shape,
      size: { width: size.width, height: size.height },
    }
  } catch {
    return null
  }
}

function isCanvasShape(value: unknown): value is CanvasShape {
  return (
    typeof value === "string" &&
    NODE_SHAPES.some((shape) => shape === value)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}
