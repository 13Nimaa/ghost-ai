import { z } from "zod"

export const AI_STATUS_FEED = "ai-status-feed" as const
export const AI_CHAT_FEED = "ai-chat" as const

export const aiChatRoleSchema = z.enum(["user", "assistant"])

export const aiChatMessageSchema = z.object({
  sender: z.string().trim().min(1),
  role: aiChatRoleSchema,
  content: z.string().trim().min(1),
  timestamp: z.number().finite(),
})

export type AiChatRole = z.infer<typeof aiChatRoleSchema>
export type AiChatMessage = z.infer<typeof aiChatMessageSchema>

export function validateAiChatMessage(data: unknown): AiChatMessage | null {
  const result = aiChatMessageSchema.safeParse(data)
  return result.success ? result.data : null
}

export const aiStatusPhaseSchema = z.enum([
  "start",
  "processing",
  "complete",
  "error",
])

export type AiStatusPhase = z.infer<typeof aiStatusPhaseSchema>

export const aiStatusFeedPayloadSchema = z.object({
  type: z.string().optional().default("AI_STATUS"),
  feed: z.string().optional().default(AI_STATUS_FEED),
  phase: aiStatusPhaseSchema.default("processing"),
  message: z.string().optional(),
  text: z.string().optional(),
  timestamp: z.number().optional(),
})

export type AiStatusFeedPayload = z.infer<typeof aiStatusFeedPayloadSchema>

export interface ValidatedAiStatus {
  type: string
  feed: string
  phase: AiStatusPhase
  message: string
  text?: string
  timestamp?: number
  displayMessage: string
}

export function validateAiStatusMessage(
  data: unknown,
): ValidatedAiStatus | null {
  const result = aiStatusFeedPayloadSchema.safeParse(data)
  if (!result.success) {
    return null
  }

  const payload = result.data
  const displayMessage = (payload.text ?? payload.message ?? "").trim()
  if (!displayMessage) {
    return null
  }

  return {
    type: payload.type ?? "AI_STATUS",
    feed: payload.feed ?? AI_STATUS_FEED,
    phase: payload.phase,
    message: payload.message ?? displayMessage,
    text: payload.text,
    timestamp: payload.timestamp ?? Date.now(),
    displayMessage,
  }
}
