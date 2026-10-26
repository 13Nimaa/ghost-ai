import { google } from "@ai-sdk/google"
import { logger, metadata, schemaTask } from "@trigger.dev/sdk"
import { generateText } from "ai"
import { z } from "zod"

import {
  MAX_CANVAS_EDGES,
  MAX_CANVAS_NODES,
} from "@/lib/canvas-snapshot"
import { deleteSpecArtifact, uploadSpecArtifact } from "@/lib/spec-storage"
import { prisma } from "@/lib/prisma"
import { aiChatMessageSchema } from "@/types/tasks"

const canvasNodeSchema = z
  .object({
    id: z.string().min(1),
    position: z.object({
      x: z.number().finite(),
      y: z.number().finite(),
    }),
    data: z
      .object({
        label: z.string().optional(),
        shape: z.string().optional(),
        color: z.string().optional(),
        textColor: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough()

const canvasEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    data: z
      .object({
        label: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export const generateSpecRequestSchema = z.object({
  roomId: z.string().trim().min(1),
  chatHistory: z.array(aiChatMessageSchema),
  nodes: z.array(canvasNodeSchema).max(MAX_CANVAS_NODES),
  edges: z.array(canvasEdgeSchema).max(MAX_CANVAS_EDGES),
})

export const generateSpecPayloadSchema = generateSpecRequestSchema.extend({
  projectId: z.string().trim().min(1),
})

export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>

function buildSystemPrompt(): string {
  return `You are Ghost AI, a technical writer for system architecture specs.

Write a clear Markdown technical specification from the provided canvas graph and chat context.

Rules:
- Output Markdown only — no surrounding code fences and no preamble
- Structure with headings: Overview, Components, Data Flow, Relationships, Open Questions
- Ground every claim in the canvas nodes/edges or chat history; do not invent services that are not present
- Use node labels as component names; use edge labels when describing relationships
- Keep the tone precise and engineering-oriented
- If the canvas is empty, say so briefly and note what is missing`
}

function buildUserPrompt(payload: GenerateSpecPayload): string {
  const nodes = payload.nodes.map((node) => ({
    id: node.id,
    label: typeof node.data.label === "string" ? node.data.label : "",
    shape: typeof node.data.shape === "string" ? node.data.shape : "",
    x: node.position.x,
    y: node.position.y,
  }))

  const edges = payload.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label:
      edge.data && typeof edge.data.label === "string" ? edge.data.label : "",
  }))

  const chat = payload.chatHistory.map((message) => ({
    role: message.role,
    sender: message.sender,
    content: message.content,
  }))

  return `Project ID: ${payload.projectId}
Room ID: ${payload.roomId}

Canvas nodes:
${JSON.stringify(nodes, null, 2)}

Canvas edges:
${JSON.stringify(edges, null, 2)}

Chat history:
${JSON.stringify(chat, null, 2)}

Generate the Markdown technical specification now.`
}

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: generateSpecPayloadSchema,
  retry: { maxAttempts: 1 },
  run: async (payload) => {
    const { projectId, roomId } = payload

    logger.info("Spec generation started", {
      projectId,
      roomId,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
      chatCount: payload.chatHistory.length,
    })
    metadata.set("status", "started")

    try {
      metadata.set("status", "processing")

      const { text } = await generateText({
        model: google("gemini-3.8-flash"),
        system: buildSystemPrompt(),
        prompt: buildUserPrompt(payload),
        providerOptions: {
          google: {
            thinkingConfig: { thinkingLevel: "low" },
          },
        },
      })

      const content = text.trim()
      if (!content) {
        throw new Error("Spec generation returned empty content")
      }

      metadata.set("status", "uploading")
      const artifact = await uploadSpecArtifact(projectId, content)

      try {
        metadata.set("status", "persisting")
        await prisma.projectSpec.create({
          data: {
            projectId,
            filePath: artifact.filePath,
          },
        })
      } catch (error) {
        try {
          await deleteSpecArtifact(artifact.fileKey)
        } catch (cleanupError) {
          const cleanupMessage =
            cleanupError instanceof Error
              ? cleanupError.message
              : "Unknown cleanup error"
          logger.warn("Failed to clean up uploaded spec", {
            projectId,
            fileKey: artifact.fileKey,
            message: cleanupMessage,
          })
        }

        throw error
      }

      metadata.set("status", "complete")
      logger.info("Spec generation finished", {
        projectId,
        roomId,
        contentLength: content.length,
      })

      return { content }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Spec generation failed"

      logger.error("Spec generation failed", { projectId, roomId, message })
      metadata.set("status", "error")
      throw error
    }
  },
})
