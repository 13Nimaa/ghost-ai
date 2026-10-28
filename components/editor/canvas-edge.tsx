"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  MarkerType,
  getSmoothStepPath,
  type DefaultEdgeOptions,
  type EdgeProps,
  type OnEdgesChange,
} from "@xyflow/react"

import type { CanvasEdge } from "@/types/canvas"

export const CANVAS_EDGE_DEFAULTS = {
  type: "canvasEdge",
  data: { label: "" },
  interactionWidth: 28,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "var(--text-secondary)",
    height: 16,
    width: 16,
  },
} satisfies DefaultEdgeOptions

interface CanvasEdgeActions {
  updateLabel: (id: string, label: string) => void
}

interface CanvasEdgeActionsProviderProps {
  children: ReactNode
  edges: CanvasEdge[]
  onEdgesChange: OnEdgesChange<CanvasEdge>
}

const CanvasEdgeActionsContext = createContext<CanvasEdgeActions | null>(null)

export function CanvasEdgeActionsProvider({
  children,
  edges,
  onEdgesChange,
}: CanvasEdgeActionsProviderProps) {
  const updateLabel = useCallback(
    (id: string, label: string) => {
      const edge = edges.find((candidate) => candidate.id === id)

      if (!edge) {
        return
      }

      onEdgesChange([
        {
          id,
          type: "replace",
          item: {
            ...edge,
            type: "canvasEdge",
            data: { ...edge.data, label },
          },
        },
      ])
    },
    [edges, onEdgesChange],
  )

  return (
    <CanvasEdgeActionsContext.Provider value={{ updateLabel }}>
      {children}
    </CanvasEdgeActionsContext.Provider>
  )
}

export function CanvasEdgeRenderer({
  data,
  id,
  interactionWidth,
  markerEnd,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  style,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<CanvasEdge>) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [draftLabel, setDraftLabel] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const actions = useContext(CanvasEdgeActionsContext)
  const label = typeof data?.label === "string" ? data.label : ""
  const isActive = selected || isHovered
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
    borderRadius: 8,
    offset: 20,
  })

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  function startEditing() {
    setDraftLabel(label)
    setIsEditing(true)
  }

  function saveLabel() {
    actions?.updateLabel(id, draftLabel)
    setIsEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault()
      saveLabel()
    }
  }

  return (
    <>
      <g
        onDoubleClick={(event) => {
          event.stopPropagation()
          startEditing()
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BaseEdge
          className="transition-[stroke,opacity] duration-150"
          interactionWidth={interactionWidth ?? 28}
          markerEnd={markerEnd}
          path={edgePath}
          style={{
            ...style,
            opacity: isActive ? 1 : 0.62,
            stroke: isActive
              ? "var(--text-primary)"
              : "var(--text-secondary)",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 1.5,
          }}
        />
      </g>

      {(label || selected || isEditing) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan nowheel pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onDoubleClick={(event) => {
              event.stopPropagation()
              startEditing()
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                aria-label="Edge label"
                className="h-7 max-w-64 rounded-xl border border-subtle-border bg-elevated px-2.5 text-center text-xs text-copy-primary shadow-lg outline-none placeholder:text-copy-faint focus:border-brand"
                onBlur={saveLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add label"
                style={{
                  width: `${Math.min(Math.max(draftLabel.length + 2, 11), 40)}ch`,
                }}
                value={draftLabel}
              />
            ) : (
              <span
                className={
                  label
                    ? "block rounded-xl border border-surface-border bg-elevated px-2.5 py-1 text-xs leading-none text-copy-primary shadow-sm"
                    : "block rounded-xl border border-subtle-border bg-surface/90 px-2.5 py-1 text-xs leading-none text-copy-muted"
                }
              >
                {label || "Add label"}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
