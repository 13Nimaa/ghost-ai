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
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
  type OnNodesChange,
} from "@xyflow/react"

import { CanvasShapeVisual } from "@/components/editor/canvas-shape"
import { NodeColorToolbar } from "@/components/editor/node-color-toolbar"
import {
  getNodeColorPair,
  type CanvasNode,
  type CanvasNodeColor,
} from "@/types/canvas"

const MIN_NODE_WIDTH = 80
const MIN_NODE_HEIGHT = 48

interface CanvasNodeActions {
  updateColor: (id: string, color: CanvasNodeColor) => void
  updateLabel: (id: string, label: string) => void
}

interface CanvasNodeActionsProviderProps {
  children: ReactNode
  nodes: CanvasNode[]
  onNodesChange: OnNodesChange<CanvasNode>
}

const CanvasNodeActionsContext = createContext<CanvasNodeActions | null>(null)

export function CanvasNodeActionsProvider({
  children,
  nodes,
  onNodesChange,
}: CanvasNodeActionsProviderProps) {
  const updateNodeData = useCallback(
    (id: string, data: Partial<CanvasNode["data"]>) => {
      const node = nodes.find((candidate) => candidate.id === id)

      if (!node) {
        return
      }

      onNodesChange([
        {
          id,
          type: "replace",
          item: {
            ...node,
            data: { ...node.data, ...data },
          },
        },
      ])
    },
    [nodes, onNodesChange],
  )

  const updateLabel = useCallback(
    (id: string, label: string) => {
      updateNodeData(id, { label })
    },
    [updateNodeData],
  )

  const updateColor = useCallback(
    (id: string, color: CanvasNodeColor) => {
      updateNodeData(id, { color: color.fill, textColor: color.text })
    },
    [updateNodeData],
  )

  return (
    <CanvasNodeActionsContext.Provider value={{ updateColor, updateLabel }}>
      {children}
    </CanvasNodeActionsContext.Provider>
  )
}

export function CanvasNodeRenderer({
  data,
  id,
  selected,
}: NodeProps<CanvasNode>) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const actions = useContext(CanvasNodeActionsContext)
  const activeColor = getNodeColorPair(data.color, data.textColor)

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
    }
  }, [isEditing])

  function handleLabelChange(value: string) {
    setDraftLabel(value)
    actions?.updateLabel(id, value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      setIsEditing(false)
    }
  }

  return (
    <div
      className="group/canvas-node relative h-full w-full"
      style={{ color: activeColor.text }}
    >
      {[
        { id: "top", position: Position.Top },
        { id: "right", position: Position.Right },
        { id: "bottom", position: Position.Bottom },
        { id: "left", position: Position.Left },
      ].map(({ id: handleId, position }) => (
        <Handle
          key={handleId}
          id={handleId}
          aria-label={`${handleId} connection handle`}
          className="!h-2 !w-2 !border !opacity-0 !transition-opacity !duration-150 group-hover/canvas-node:!opacity-100"
          position={position}
          style={{
            background: "var(--text-primary)",
            borderColor: "var(--bg-base)",
            zIndex: 30,
          }}
          type="source"
        />
      ))}
      {selected ? (
        <NodeColorToolbar
          activeColor={activeColor}
          onSelect={(color) => actions?.updateColor(id, color)}
        />
      ) : null}
      <NodeResizer
        autoScale
        color="var(--accent-primary)"
        handleStyle={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "9999px",
          height: 8,
          width: 8,
          zIndex: 20,
        }}
        isVisible={selected}
        lineStyle={{ opacity: 0.45, zIndex: 20 }}
        minHeight={MIN_NODE_HEIGHT}
        minWidth={MIN_NODE_WIDTH}
      />
      <CanvasShapeVisual color={data.color} selected={selected} shape={data.shape} />
      <div
        className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center text-sm"
        onDoubleClick={(event) => {
          event.stopPropagation()
          setDraftLabel(data.label)
          setIsEditing(true)
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            aria-label="Node label"
            className="nodrag nopan nowheel field-sizing-content min-h-5 w-full max-h-full resize-none overflow-auto border-0 bg-transparent px-1 py-0 text-center leading-5 outline-none placeholder:text-copy-muted"
            onBlur={() => setIsEditing(false)}
            onChange={(event) => handleLabelChange(event.target.value)}
            onDoubleClick={(event) => event.stopPropagation()}
            onKeyDown={handleKeyDown}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            placeholder="Add label"
            value={draftLabel}
          />
        ) : (
          <span className={data.label ? undefined : "opacity-60"}>
            {data.label || "Add label"}
          </span>
        )}
      </div>
    </div>
  )
}
