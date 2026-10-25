import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export const MAX_CANVAS_BYTES = 2 * 1024 * 1024
export const MAX_CANVAS_NODES = 3000
export const MAX_CANVAS_EDGES = 6000

export interface CanvasSnapshot {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export const EMPTY_CANVAS_SNAPSHOT: CanvasSnapshot = { nodes: [], edges: [] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string"
}

function isCanvasNode(value: unknown): value is CanvasNode {
  if (!isRecord(value)) {
    return false
  }

  const position = value.position

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isRecord(position) &&
    isFiniteNumber(position.x) &&
    isFiniteNumber(position.y) &&
    isRecord(value.data) &&
    isOptionalString(value.type) &&
    (value.width === undefined || isFiniteNumber(value.width)) &&
    (value.height === undefined || isFiniteNumber(value.height))
  )
}

function isCanvasEdge(value: unknown): value is CanvasEdge {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.source === "string" &&
    value.source.length > 0 &&
    typeof value.target === "string" &&
    value.target.length > 0 &&
    isOptionalString(value.type) &&
    (value.data === undefined || isRecord(value.data)) &&
    isOptionalString(value.label)
  )
}

function hasUniqueIds(items: { id: string }[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length
}

/**
 * Validates untrusted canvas JSON before it is stored or loaded. The original
 * node and edge objects are preserved so canvas state round-trips faithfully.
 */
export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  if (!isRecord(value)) {
    return null
  }

  const { nodes, edges } = value

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return null
  }

  if (nodes.length > MAX_CANVAS_NODES || edges.length > MAX_CANVAS_EDGES) {
    return null
  }

  if (!nodes.every(isCanvasNode) || !edges.every(isCanvasEdge)) {
    return null
  }

  if (!hasUniqueIds(nodes) || !hasUniqueIds(edges)) {
    return null
  }

  return { nodes, edges }
}

/**
 * Validates the canvas API response envelope. A `null` canvas is the intentional
 * empty state returned when a project has no saved snapshot yet.
 */
export function parseCanvasResponse(value: unknown): CanvasSnapshot | null {
  if (!isRecord(value)) {
    return null
  }

  if (value.canvas === null) {
    return EMPTY_CANVAS_SNAPSHOT
  }

  return parseCanvasSnapshot(value.canvas)
}
