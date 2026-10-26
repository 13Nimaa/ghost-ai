"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from "react"
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
  useCanRedo,
  useCanUndo,
  useRedo,
  useRoom,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense"
import { ErrorBoundary } from "react-error-boundary"

import {
  CANVAS_EDGE_DEFAULTS,
  CanvasEdgeActionsProvider,
  CanvasEdgeRenderer,
} from "@/components/editor/canvas-edge"
import { CanvasControlBar } from "@/components/editor/canvas-control-bar"
import { AiStatusFeed } from "@/components/editor/ai-status-feed"
import { LiveCursors } from "@/components/editor/live-cursors"
import { PresenceAvatars } from "@/components/editor/presence-avatars"
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
import { parseCanvasResponse } from "@/lib/canvas-snapshot"
import {
  useCanvasAutosave,
  type CanvasSaveStatus,
} from "@/hooks/use-canvas-autosave"
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
  onSaveStatusChange: (status: CanvasSaveStatus) => void
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
  onSaveStatusChange,
}: CollaborativeCanvasProps) {
  return (
    <div className="h-full w-full p-2">
      <ErrorBoundary
        fallback={<CanvasState message="Unable to connect to this canvas." />}
        resetKeys={[roomId]}
      >
        <ClientSideSuspense
          fallback={<CanvasState message="Loading collaborative canvas…" />}
        >
          <Canvas
            key={roomId}
            roomId={roomId}
            isTemplatesOpen={isTemplatesOpen}
            onTemplatesOpenChange={onTemplatesOpenChange}
            onSaveStatusChange={onSaveStatusChange}
          />
        </ClientSideSuspense>
      </ErrorBoundary>
    </div>
  )
}

interface CanvasProps {
  roomId: string
  isTemplatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
  onSaveStatusChange: (status: CanvasSaveStatus) => void
}

function Canvas({
  roomId,
  isTemplatesOpen,
  onTemplatesOpenChange,
  onSaveStatusChange,
}: CanvasProps) {
  const [reactFlow, setReactFlow] = useState<
    ReactFlowInstance<CanvasNode, CanvasEdge> | null
  >(null)
  const nodeCounter = useRef(0)
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const room = useRoom()
  const updateMyPresence = useUpdateMyPresence()
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

  const [autosaveReady, setAutosaveReady] = useState(false)
  const loadStartedRef = useRef(false)
  const loadContextRef = useRef({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    room,
    reactFlow,
  })

  useEffect(() => {
    loadContextRef.current = {
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      room,
      reactFlow,
    }
  }, [edges, nodes, onEdgesChange, onNodesChange, reactFlow, room])

  useEffect(() => {
    if (loadStartedRef.current) {
      return
    }

    loadStartedRef.current = true

    const { nodes: currentNodes, edges: currentEdges } = loadContextRef.current

    if (currentNodes.length > 0 || currentEdges.length > 0) {
      setAutosaveReady(true)
      return
    }

    const controller = new AbortController()
    let active = true

    async function restoreCanvas() {
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(roomId)}/canvas`,
          { cache: "no-store", signal: controller.signal },
        )

        if (!response.ok) {
          return
        }

        const snapshot = parseCanvasResponse(await response.json())

        if (
          !snapshot ||
          (snapshot.nodes.length === 0 && snapshot.edges.length === 0)
        ) {
          return
        }

        const context = loadContextRef.current

        if (context.nodes.length > 0 || context.edges.length > 0) {
          return
        }

        context.room.batch(() => {
          if (snapshot.nodes.length > 0) {
            context.onNodesChange(
              snapshot.nodes.map((item) => ({ type: "add" as const, item })),
            )
          }

          if (snapshot.edges.length > 0) {
            context.onEdgesChange(
              snapshot.edges.map((item) => ({ type: "add" as const, item })),
            )
          }
        })

        window.requestAnimationFrame(() => {
          void loadContextRef.current.reactFlow?.fitView({
            nodes: snapshot.nodes,
            padding: 0.18,
            duration: 350,
          })
        })
      } catch {
        // A failed load leaves the empty room usable; autosave starts below.
      } finally {
        if (active) {
          window.requestAnimationFrame(() => {
            if (active) {
              setAutosaveReady(true)
            }
          })
        }
      }
    }

    void restoreCanvas()

    return () => {
      active = false
      loadStartedRef.current = false
      controller.abort()
    }
  }, [roomId])

  const autosave = useCanvasAutosave({
    projectId: roomId,
    nodes,
    edges,
    enabled: autosaveReady,
  })

  useEffect(() => {
    onSaveStatusChange(autosave.status)
  }, [autosave.status, onSaveStatusChange])

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!reactFlow) {
        return
      }

      updateMyPresence({
        cursor: reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      })
    },
    [reactFlow, updateMyPresence],
  )

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

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
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
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
            <LiveCursors />
            <Panel position="top-left">
              <AiStatusFeed />
            </Panel>
            <Panel position="top-right">
              <PresenceAvatars />
            </Panel>
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
