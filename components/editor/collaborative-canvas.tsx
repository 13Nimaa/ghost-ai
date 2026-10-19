"use client"

import { useCallback, useRef, useState, type DragEvent } from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MiniMap,
  Panel,
  ReactFlow,
  type Connection,
  type EdgeTypes,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useCanRedo,
  useCanUndo,
  useRedo,
  useRoom,
  useUndo,
} from "@liveblocks/react/suspense"
import { ErrorBoundary } from "react-error-boundary"

import {
  CANVAS_EDGE_DEFAULTS,
  CanvasEdgeActionsProvider,
  CanvasEdgeRenderer,
} from "@/components/editor/canvas-edge"
import { CanvasControlBar } from "@/components/editor/canvas-control-bar"
import {
  CanvasNodeActionsProvider,
  CanvasNodeRenderer,
} from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import {
  CANVAS_SHAPE_DRAG_TYPE,
  parseShapeDragPayload,
} from "@/lib/canvas-drag"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import {
  DEFAULT_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

import "@xyflow/react/dist/style.css"

interface CollaborativeCanvasProps {
  roomId: string
  isTemplatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
}

const nodeTypes = {
  canvasNode: CanvasNodeRenderer,
} satisfies NodeTypes

const edgeTypes = {
  canvasEdge: CanvasEdgeRenderer,
} satisfies EdgeTypes

export function CollaborativeCanvas({
  roomId,
  isTemplatesOpen,
  onTemplatesOpenChange,
}: CollaborativeCanvasProps) {
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
              <Canvas
                isTemplatesOpen={isTemplatesOpen}
                onTemplatesOpenChange={onTemplatesOpenChange}
              />
            </ClientSideSuspense>
          </RoomProvider>
        </ErrorBoundary>
      </LiveblocksProvider>
    </div>
  )
}

interface CanvasProps {
  isTemplatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
}

function Canvas({ isTemplatesOpen, onTemplatesOpenChange }: CanvasProps) {
  const [reactFlow, setReactFlow] = useState<
    ReactFlowInstance<CanvasNode, CanvasEdge> | null
  >(null)
  const nodeCounter = useRef(0)
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const room = useRoom()
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

  useKeyboardShortcuts(reactFlow, undo, redo)

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect({ ...connection, ...CANVAS_EDGE_DEFAULTS })
    },
    [onConnect],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const payload = parseShapeDragPayload(
        event.dataTransfer.getData(CANVAS_SHAPE_DRAG_TYPE),
      )

      if (!payload || !reactFlow) {
        return
      }

      nodeCounter.current += 1

      const node: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${nodeCounter.current}`,
        type: "canvasNode",
        position: reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
        width: payload.size.width,
        height: payload.size.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR.fill,
          textColor: DEFAULT_NODE_COLOR.text,
          shape: payload.shape,
        },
      }

      onNodesChange([{ type: "add", item: node }])
    },
    [onNodesChange, reactFlow],
  )

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      room.batch(() => {
        if (edges.length > 0) {
          onEdgesChange(edges.map((edge) => ({ id: edge.id, type: "remove" })))
        }

        if (nodes.length > 0) {
          onNodesChange(nodes.map((node) => ({ id: node.id, type: "remove" })))
        }

        onNodesChange(
          template.nodes.map((node) => ({ item: node, type: "add" })),
        )
        onEdgesChange(
          template.edges.map((edge) => ({ item: edge, type: "add" })),
        )
      })

      window.requestAnimationFrame(() => {
        void reactFlow?.fitView({
          nodes: template.nodes,
          padding: 0.18,
          duration: 350,
        })
      })
    },
    [edges, nodes, onEdgesChange, onNodesChange, reactFlow, room],
  )

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-surface-border bg-surface">
      <CanvasEdgeActionsProvider edges={edges} onEdgesChange={onEdgesChange}>
        <CanvasNodeActionsProvider nodes={nodes} onNodesChange={onNodesChange}>
          <ReactFlow<CanvasNode, CanvasEdge>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={CANVAS_EDGE_DEFAULTS}
            onInit={setReactFlow}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onDelete={onDelete}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{
              stroke: "var(--text-secondary)",
              strokeLinecap: "round",
              strokeWidth: 1.5,
            }}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} />
            <Panel position="bottom-left">
              <CanvasControlBar
                reactFlow={reactFlow}
                canUndo={canUndo}
                canRedo={canRedo}
                undo={undo}
                redo={redo}
              />
            </Panel>
            <Panel position="bottom-center">
              <ShapePanel />
            </Panel>
          </ReactFlow>
        </CanvasNodeActionsProvider>
      </CanvasEdgeActionsProvider>
      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={onTemplatesOpenChange}
        onImport={handleImportTemplate}
      />
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
