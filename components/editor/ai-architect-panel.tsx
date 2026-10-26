"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import {
  useCreateFeedMessage,
  useFeedMessages,
  useSelf,
} from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { ArrowUp, Bot, Loader2 } from "lucide-react"

import { AiStatusFeed } from "@/components/editor/ai-status-feed"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAiPresenceState } from "@/hooks/use-ai-presence-state"
import {
  AI_CHAT_FEED,
  type AiChatMessage,
  validateAiChatMessage,
} from "@/types/tasks"

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

const MIN_TEXTAREA_HEIGHT = 72
const MAX_TEXTAREA_HEIGHT = 160

interface RenderableChatMessage extends AiChatMessage {
  id: string
  createdAt: number
}

interface ActiveDesignRun {
  runId: string
  publicToken: string
}

const TERMINAL_RUN_STATUSES = new Set([
  "COMPLETED",
  "CANCELED",
  "CRASHED",
  "EXPIRED",
  "FAILED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
])

function readStringField(value: unknown, field: string): string | null {
  if (typeof value !== "object" || value === null || !(field in value)) {
    return null
  }

  const fieldValue = (value as Record<string, unknown>)[field]
  return typeof fieldValue === "string" && fieldValue.trim().length > 0
    ? fieldValue.trim()
    : null
}

function getRunSummary(output: unknown): string {
  return (
    readStringField(output, "summary") ??
    "Ghost AI updated the shared canvas."
  )
}

export function AiArchitectPanel({ roomId }: { roomId: string }) {
  const [draft, setDraft] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [activeRun, setActiveRun] = useState<ActiveDesignRun | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const completedRunRef = useRef<string | null>(null)

  const self = useSelf()
  const createFeedMessage = useCreateFeedMessage()
  const feedResult = useFeedMessages(AI_CHAT_FEED, { limit: 100 })
  const messages = ("messages" in feedResult ? feedResult.messages : []) ?? []
  const isLoading = "isLoading" in feedResult && feedResult.isLoading
  const hasFeedError = "error" in feedResult && Boolean(feedResult.error)
  const sender = self?.info.name?.trim() || "Collaborator"
  const { isAiActive: isSharedAiActive } = useAiPresenceState()
  const isRunActive = isSubmitting || activeRun !== null || isSharedAiActive

  const chatMessages = messages
    .map((message): RenderableChatMessage | null => {
      const data = validateAiChatMessage(message.data)
      if (!data) return null

      return {
        ...data,
        id: message.id,
        createdAt: message.createdAt,
      }
    })
    .filter((message): message is RenderableChatMessage => message !== null)
    .sort((first, second) => {
      if (first.createdAt !== second.createdAt) {
        return first.createdAt - second.createdAt
      }

      return first.id.localeCompare(second.id)
    })

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(
      Math.max(textarea.scrollHeight, MIN_TEXTAREA_HEIGHT),
      MAX_TEXTAREA_HEIGHT,
    )}px`
  }, [draft])

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ block: "end" })
  }, [chatMessages.length])

  const createAssistantMessage = useCallback(
    async (content: string) => {
      await createFeedMessage(AI_CHAT_FEED, {
        sender: "Ghost AI",
        role: "assistant",
        content,
        timestamp: Date.now(),
      })
    },
    [createFeedMessage],
  )

  const finishRun = useCallback(
    async (runId: string, succeeded: boolean, output?: unknown) => {
      if (completedRunRef.current === runId) return
      completedRunRef.current = runId

      try {
        await createAssistantMessage(
          succeeded
            ? getRunSummary(output)
            : "Ghost AI could not finish this design request. Please try again.",
        )
      } catch {
        setSendError("The run finished, but its reply could not be shared.")
      } finally {
        setActiveRun(null)
        setIsSubmitting(false)
        textareaRef.current?.focus()
      }
    },
    [createAssistantMessage],
  )

  const handleRunComplete = useCallback(
    (completedRun: { id: string; status: string; output?: unknown }, error?: Error) => {
      if (!error && !TERMINAL_RUN_STATUSES.has(completedRun.status)) return

      void finishRun(
        completedRun.id,
        !error && completedRun.status === "COMPLETED",
        completedRun.output,
      )
    },
    [finishRun],
  )

  useRealtimeRun(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: activeRun !== null,
    onComplete: handleRunComplete,
    skipColumns: ["payload"],
  })

  async function submit(value: string) {
    const content = value.trim()
    if (!content || isRunActive) return

    const timestamp = Date.now()
    const data: AiChatMessage = {
      sender,
      role: "user",
      content,
      timestamp,
    }

    setIsSubmitting(true)
    setSendError(null)
    let userMessageSent = false

    try {
      await createFeedMessage(AI_CHAT_FEED, data, { createdAt: timestamp })
      userMessageSent = true
      setDraft("")

      const designResponse = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content,
          roomId,
          projectId: roomId,
        }),
      })
      const designBody: unknown = await designResponse.json().catch(() => null)
      const runId = readStringField(designBody, "runId")

      if (!designResponse.ok || !runId) {
        throw new Error("Could not start the design run")
      }

      const tokenResponse = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      })
      const tokenBody: unknown = await tokenResponse.json().catch(() => null)
      const publicToken = readStringField(tokenBody, "token")

      if (!tokenResponse.ok || !publicToken) {
        throw new Error("Could not connect to the design run")
      }

      completedRunRef.current = null
      setActiveRun({ runId, publicToken })
    } catch {
      if (userMessageSent) {
        try {
          await createAssistantMessage(
            "Ghost AI could not start this design request. Please try again.",
          )
        } catch {
          setSendError("Could not share the design request error.")
        }
      } else {
        setSendError("Could not send message. Please try again.")
      }
      setIsSubmitting(false)
    }

    textareaRef.current?.focus()
  }

  function applyStarterPrompt(prompt: string) {
    if (isRunActive) return
    setDraft(prompt)
    textareaRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return

    // Let IME composition finish before treating Enter as a submit.
    if (event.nativeEvent.isComposing || isRunActive) return

    event.preventDefault()
    void submit(draft)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 px-4 text-xs text-copy-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Loading room chat…
        </div>
      ) : hasFeedError ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-xs text-state-error">
          Unable to load room chat messages.
        </div>
      ) : chatMessages.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-4 py-6">
          <EmptyState
            onSelectStarterPrompt={applyStarterPrompt}
            disabled={isRunActive}
          />
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 px-4 py-4">
            {chatMessages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender === sender}
              />
            ))}
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>
      )}

      <div className="border-t border-surface-border p-3">
        {sendError ? (
          <p role="alert" className="mb-2 text-xs text-state-error">
            {sendError}
          </p>
        ) : null}
        <AiStatusFeed variant="sidebar" active={isRunActive} className="mb-2" />
        <div className="rounded-2xl border border-surface-border bg-elevated p-2 focus-within:border-subtle-border">
          <Textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message everyone in this room…"
            aria-label="Message everyone in this room"
            disabled={isRunActive}
            className="field-sizing-fixed min-h-[72px] max-h-40 resize-none overflow-y-auto rounded-xl border-0 bg-transparent px-2 py-1 text-sm text-copy-primary shadow-none placeholder:text-copy-faint focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-1 flex items-center justify-between gap-2 px-1">
            <p className="text-[0.65rem] text-copy-faint">
              Enter to send · Shift+Enter for a new line
            </p>
            <Button
              size="icon-sm"
              onClick={() => void submit(draft)}
              disabled={!draft.trim() || isRunActive}
              aria-label={isRunActive ? "Generating design" : "Send message"}
              className="rounded-xl bg-state-success text-on-brand hover:bg-state-success/90"
            >
              {isRunActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-on-brand" />
              ) : (
                <ArrowUp />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  onSelectStarterPrompt,
  disabled,
}: {
  onSelectStarterPrompt: (prompt: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-elevated text-ai-text"
      >
        <Bot className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-medium text-copy-primary">
          Start a room conversation
        </p>
        <p className="mt-1 text-sm leading-relaxed text-copy-muted">
          Messages here are shared with everyone collaborating in this room.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelectStarterPrompt(prompt)}
            className={cn(
              "rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-ai-text transition-colors hover:bg-elevated",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChatMessageBubble({
  message,
  isOwn,
}: {
  message: RenderableChatMessage
  isOwn: boolean
}) {
  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div className="max-w-[85%]">
        <div
          className={cn(
            "mb-1 flex items-center gap-2 text-[0.65rem] text-copy-faint",
            isOwn ? "justify-end" : "justify-start",
          )}
        >
          <span className="font-medium text-copy-muted">{message.sender}</span>
          <span aria-hidden>·</span>
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {formatChatTimestamp(message.timestamp)}
          </time>
        </div>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isOwn
              ? "border-2 border-state-success/50 bg-state-success text-on-brand"
              : "border border-surface-border bg-elevated text-copy-primary",
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}

function formatChatTimestamp(timestamp: number): string {
  return `${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(timestamp))} UTC`
}
