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
  { name: "Neutral", fill: "#1F1F1F", text: "#EDEDED" },
  { name: "Blue", fill: "#10233D", text: "#52A8FF" },
  { name: "Purple", fill: "#2E1938", text: "#BF7AF0" },
  { name: "Orange", fill: "#331B00", text: "#FF990A" },
  { name: "Red", fill: "#3C1618", text: "#FF6166" },
  { name: "Pink", fill: "#3A1726", text: "#F75F8F" },
  { name: "Green", fill: "#0F2E18", text: "#62C073" },
  { name: "Teal", fill: "#062822", text: "#0AC7B4" },
] as const

export type CanvasNodeColor = (typeof NODE_COLORS)[number]

export const DEFAULT_NODE_COLOR = NODE_COLORS[0]

export function getNodeColorPair(
  fill: string,
  text?: string,
): CanvasNodeColor {
  return (
    NODE_COLORS.find(
      (color) => color.fill === fill && (!text || color.text === text),
    ) ??
    NODE_COLORS.find((color) => color.fill === fill) ??
    DEFAULT_NODE_COLOR
  )
}

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
  textColor?: string
  shape: CanvasShape
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string
}

export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">
