import {
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  type CanvasNode,
  type CanvasNodeSize,
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

/** Place the node's top-left so its center sits on the cursor/drop point. */
export function centeredNodePosition(
  flowPoint: { x: number; y: number },
  size: CanvasNodeSize,
) {
  return {
    x: flowPoint.x - size.width / 2,
    y: flowPoint.y - size.height / 2,
  }
}

export function createCanvasShapeNode(
  shape: CanvasShape,
  flowPoint: { x: number; y: number },
  counter: number,
): CanvasNode {
  const size = SHAPE_DEFAULT_SIZES[shape]

  return {
    id: `${shape}-${Date.now()}-${counter}`,
    type: "canvasNode",
    position: centeredNodePosition(flowPoint, size),
    width: size.width,
    height: size.height,
    data: {
      label: "",
      color: DEFAULT_NODE_COLOR.fill,
      textColor: DEFAULT_NODE_COLOR.text,
      shape,
    },
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
