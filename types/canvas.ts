import type { Edge, Node } from "@xyflow/react"

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

export type CanvasShape = (typeof NODE_SHAPES)[number]

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const

export const DEFAULT_NODE_COLOR = NODE_COLORS[0]

export interface CanvasNodeSize {
  width: number
  height: number
}

export const SHAPE_DEFAULT_SIZES: Record<CanvasShape, CanvasNodeSize> = {
  rectangle: { width: 180, height: 96 },
  diamond: { width: 168, height: 128 },
  circle: { width: 120, height: 120 },
  pill: { width: 180, height: 72 },
  cylinder: { width: 152, height: 112 },
  hexagon: { width: 172, height: 104 },
}

export interface ShapeDragPayload {
  shape: CanvasShape
  size: CanvasNodeSize
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color: string
  shape: CanvasShape
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">
export type CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">
