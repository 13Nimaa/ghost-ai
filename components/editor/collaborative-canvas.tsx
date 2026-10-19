"use client"

import { useCallback, useRef, type DragEvent } from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  Panel,
  ReactFlow,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"
import { ErrorBoundary } from "react-error-boundary"

import { CanvasNodeRenderer } from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
import {
  CANVAS_SHAPE_DRAG_TYPE,
  parseShapeDragPayload,
} from "@/lib/canvas-drag"
import {
  DEFAULT_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

import "@xyflow/react/dist/style.css"

interface CollaborativeCanvasProps {
  roomId: string
}

const nodeTypes = {
  canvasNode: CanvasNodeRenderer,
} satisfies NodeTypes

export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  return (
    <div className="h-full w-full p-2">
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <ErrorBoundary
          fallback={<CanvasState message="Unable to connect to this canvas." />}
          resetKeys={[roomId]}
        >
          <RoomProvider
            id={roomId}
            initialPresence={{ cursor: null, isThinking: false }}
          >
            <ClientSideSuspense
              fallback={<CanvasState message="Loading collaborative canvas…" />}
            >
              <Canvas />
            </ClientSideSuspense>
          </RoomProvider>
        </ErrorBoundary>
      </LiveblocksProvider>
    </div>
  )
}

function Canvas() {
  const reactFlow = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const nodeCounter = useRef(0)
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: { initial: [] },
    edges: { initial: [] },
  })

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const payload = parseShapeDragPayload(
        event.dataTransfer.getData(CANVAS_SHAPE_DRAG_TYPE),
      )

      if (!payload || !reactFlow.current) {
        return
      }

      nodeCounter.current += 1

      const node: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${nodeCounter.current}`,
        type: "canvasNode",
        position: reactFlow.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
        width: payload.size.width,
        height: payload.size.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR.fill,
          shape: payload.shape,
        },
      }

      onNodesChange([{ type: "add", item: node }])
    },
    [onNodesChange],
  )

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-surface-border bg-surface">
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          reactFlow.current = instance
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
        <Panel position="bottom-center">
          <ShapePanel />
        </Panel>
      </ReactFlow>
    </div>
  )
}

function CanvasState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-surface-border bg-surface text-sm text-copy-muted">
      {message}
    </div>
  )
}
