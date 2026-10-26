import { google } from "@ai-sdk/google"
import { mutateFlow, type MutableFlow } from "@liveblocks/react-flow/node"
import { logger, metadata, task } from "@trigger.dev/sdk"
import { generateObject } from "ai"
import { z } from "zod"

import {
  clearAiPresence,
  publishAiStatus,
  setAiPresence,
} from "@/lib/ai-room"
import { getLiveblocksClient } from "@/lib/liveblocks"
import {
  NODE_COLORS,
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  getNodeColorPair,
  type CanvasEdge,
  type CanvasNode,
  type CanvasShape,
} from "@/types/canvas"

export interface DesignAgentPayload {
  prompt: string
  roomId: string
}

const colorNames = NODE_COLORS.map((color) => color.name) as [
  (typeof NODE_COLORS)[number]["name"],
  ...(typeof NODE_COLORS)[number]["name"][],
]

const shapeEnum = z.enum(NODE_SHAPES)
const colorNameEnum = z.enum(colorNames)

// Flat schema only — Gemini rejects anyOf (discriminatedUnion) and JSON Schema
// keywords like exclusiveMinimum / minLength / maxItems from Zod refinements.
const designActionSchema = z.object({
  type: z.enum([
    "addNode",
    "moveNode",
    "resizeNode",
    "updateNodeData",
    "deleteNode",
    "addEdge",
    "deleteEdge",
  ]),
  id: z.string(),
  label: z.string().optional(),
  shape: shapeEnum.optional(),
  colorName: colorNameEnum.optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  source: z.string().optional(),
  target: z.string().optional(),
})

const designPlanSchema = z.object({
  summary: z.string(),
  actions: z.array(designActionSchema),
})

type DesignAction = z.infer<typeof designActionSchema>

const EDGE_DEFAULTS = {
  type: "canvasEdge" as const,
  interactionWidth: 28,
  markerEnd: {
    type: "arrowclosed" as const,
    color: "var(--text-secondary)",
    height: 16,
    width: 16,
  },
}

function buildSystemPrompt(canvas: {
  nodes: readonly CanvasNode[]
  edges: readonly CanvasEdge[]
}): string {
  const shapes = NODE_SHAPES.join(", ")
  const colors = NODE_COLORS.map((color) => color.name).join(", ")
  const sizes = NODE_SHAPES.map(
    (shape) =>
      `${shape}: ${SHAPE_DEFAULT_SIZES[shape].width}x${SHAPE_DEFAULT_SIZES[shape].height}`,
  ).join("; ")

  const existing = canvas.nodes.map((node) => ({
    id: node.id,
    label: node.data.label,
    shape: node.data.shape,
    x: node.position.x,
    y: node.position.y,
  }))

  const existingEdges = canvas.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.data?.label ?? "",
  }))

  return `You are Ghost AI, a system-design architect for a collaborative canvas.

Return a plan of canvas mutations for the user's request.

Rules:
- Only use shapes: ${shapes}
- Only use colorName values: ${colors}
- Prefer default sizes (${sizes}); only resize when needed (min 80x48)
- Layout: ~270px horizontal spacing, ~126px vertical spacing between related nodes
- Place new graphs to the right of existing content when the canvas is not empty
- Prefer extend/update over deleting unless the user asks to replace or clear
- Use stable unique ids like "ai-api-gateway" for new nodes/edges
- Edges must reference existing or newly added node ids
- Keep designs readable: labels short, edges labeled when the relationship is not obvious

Current canvas nodes: ${JSON.stringify(existing)}
Current canvas edges: ${JSON.stringify(existingEdges)}`
}

function applyAction(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: DesignAction,
): { x: number; y: number } | null {
  switch (action.type) {
    case "addNode": {
      if (
        !action.id ||
        action.shape === undefined ||
        action.colorName === undefined ||
        action.x === undefined ||
        action.y === undefined
      ) {
        return null
      }

      const size = SHAPE_DEFAULT_SIZES[action.shape]
      const color = NODE_COLORS.find((entry) => entry.name === action.colorName)
      if (!color) return null

      const node: CanvasNode = {
        id: action.id,
        type: "canvasNode",
        position: { x: action.x, y: action.y },
        width: size.width,
        height: size.height,
        data: {
          label: action.label ?? "",
          color: color.fill,
          textColor: color.text,
          shape: action.shape,
        },
      }
      flow.addNode(node)
      return node.position
    }
    case "moveNode": {
      if (action.x === undefined || action.y === undefined) return null
      flow.updateNode(action.id, {
        position: { x: action.x, y: action.y },
      })
      return { x: action.x, y: action.y }
    }
    case "resizeNode": {
      if (
        action.width === undefined ||
        action.height === undefined ||
        action.width <= 0 ||
        action.height <= 0
      ) {
        return null
      }
      const node = flow.getNode(action.id)
      flow.updateNode(action.id, {
        width: action.width,
        height: action.height,
      })
      return node?.position ?? null
    }
    case "updateNodeData": {
      const node = flow.getNode(action.id)
      if (!node) return null

      const nextData: CanvasNode["data"] = { ...node.data }
      if (action.label !== undefined) nextData.label = action.label
      if (action.shape !== undefined) {
        nextData.shape = action.shape as CanvasShape
        const size = SHAPE_DEFAULT_SIZES[action.shape]
        flow.updateNode(action.id, {
          width: size.width,
          height: size.height,
        })
      }
      if (action.colorName !== undefined) {
        const color = NODE_COLORS.find((entry) => entry.name === action.colorName)
        if (color) {
          const pair = getNodeColorPair(color.fill, color.text)
          nextData.color = pair.fill
          nextData.textColor = pair.text
        }
      }
      flow.updateNodeData(action.id, nextData)
      return node.position
    }
    case "deleteNode": {
      const node = flow.getNode(action.id)
      flow.removeNode(action.id)
      return node?.position ?? null
    }
    case "addEdge": {
      if (!action.source || !action.target) return null
      const source = flow.getNode(action.source)
      const target = flow.getNode(action.target)
      if (!source || !target) return null
      flow.addEdge({
        id: action.id,
        source: action.source,
        target: action.target,
        ...EDGE_DEFAULTS,
        data: { label: action.label ?? "" },
      })
      return {
        x: (source.position.x + target.position.x) / 2,
        y: (source.position.y + target.position.y) / 2,
      }
    }
    case "deleteEdge": {
      const edge = flow.getEdge(action.id)
      const source = edge ? flow.getNode(edge.source) : undefined
      flow.removeEdge(action.id)
      return source?.position ?? null
    }
    default:
      return null
  }
}

export const designAgentTask = task({
  id: "design-agent",
  retry: { maxAttempts: 1 },
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload
    const client = getLiveblocksClient()

    logger.info("Design agent started", { roomId, prompt })
    metadata.set("status", "started")

    try {
      await setAiPresence(roomId, {
        cursor: { x: 120, y: 120 },
        thinking: true,
      })
      await publishAiStatus(roomId, "start", "Ghost AI started designing…")

      let canvasSnapshot = { nodes: [] as CanvasNode[], edges: [] as CanvasEdge[] }

      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        canvasSnapshot = {
          nodes: [...flow.nodes] as CanvasNode[],
          edges: [...flow.edges] as CanvasEdge[],
        }
      })

      await publishAiStatus(
        roomId,
        "processing",
        "Interpreting your prompt and planning the architecture…",
      )
      metadata.set("status", "processing")

      await setAiPresence(roomId, {
        cursor: { x: 240, y: 180 },
        thinking: true,
      })

      const { object: plan } = await generateObject({
        model: google("gemini-3.8-flash"),
        schema: designPlanSchema,
        system: buildSystemPrompt(canvasSnapshot),
        prompt,
        providerOptions: {
          google: {
            thinkingConfig: { thinkingLevel: "low" },
          },
        },
      })

      await publishAiStatus(
        roomId,
        "processing",
        `Applying ${plan.actions.length} canvas update${plan.actions.length === 1 ? "" : "s"}…`,
      )

      let applied = 0
      let cursor = { x: 240, y: 180 }

      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        for (const action of plan.actions.slice(0, 80)) {
          const nextCursor = applyAction(flow, action)
          if (nextCursor) {
            cursor = nextCursor
            applied += 1
          }
        }
      })

      await setAiPresence(roomId, {
        cursor: { x: cursor.x + 40, y: cursor.y + 40 },
        thinking: true,
      })

      const summary = plan.summary || "Architecture updated on the canvas."
      await publishAiStatus(roomId, "complete", summary)
      metadata.set("status", "complete")

      await setAiPresence(roomId, {
        cursor: { x: cursor.x + 40, y: cursor.y + 40 },
        thinking: false,
      })
      await clearAiPresence(roomId)

      logger.info("Design agent finished", { roomId, applied })

      return {
        summary,
        actionCount: applied,
        roomId,
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Design generation failed"

      logger.error("Design agent failed", { roomId, message })
      metadata.set("status", "error")

      try {
        await publishAiStatus(
          roomId,
          "error",
          "Ghost AI hit a problem and stopped. The canvas was left unchanged where possible.",
        )
      } catch {
        // Status publish is best-effort after a failure.
      }

      try {
        await clearAiPresence(roomId)
      } catch {
        // Presence clear is best-effort after a failure.
      }

      throw error
    }
  },
})
