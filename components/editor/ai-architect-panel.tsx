"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, Bot } from "lucide-react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

const MIN_TEXTAREA_HEIGHT = 72
const MAX_TEXTAREA_HEIGHT = 160

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

interface DesignRunOutput {
  summary?: string
  actionCount?: number
}

interface AiArchitectPanelProps {
  projectId: string
  roomId: string
}

export function AiArchitectPanel({ projectId, roomId }: AiArchitectPanelProps) {
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const nextMessageId = useRef(0)
  const handledRunRef = useRef<string | null>(null)

  const { run } = useRealtimeRun(activeRunId ?? "", {
    accessToken: accessToken ?? "",
    enabled: Boolean(activeRunId && accessToken),
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
  }, [messages])

  useEffect(() => {
    if (!run || !activeRunId || handledRunRef.current === activeRunId) {
      return
    }

    if (run.status === "COMPLETED") {
      handledRunRef.current = activeRunId
      const output = run.output as DesignRunOutput | undefined
      const summary =
        typeof output?.summary === "string" && output.summary.length > 0
          ? output.summary
          : "Architecture updates are on the canvas."

      nextMessageId.current += 1
      setMessages((current) => [
        ...current,
        {
          id: `message-${nextMessageId.current}`,
          role: "assistant",
          content: summary,
        },
      ])
      setIsSubmitting(false)
      setActiveRunId(null)
      setAccessToken(null)
      return
    }

    if (
      run.status === "FAILED" ||
      run.status === "CRASHED" ||
      run.status === "SYSTEM_FAILURE" ||
      run.status === "CANCELED" ||
      run.status === "TIMED_OUT"
    ) {
      handledRunRef.current = activeRunId
      nextMessageId.current += 1
      setMessages((current) => [
        ...current,
        {
          id: `message-${nextMessageId.current}`,
          role: "assistant",
          content:
            "Something went wrong while designing. Check the canvas status and try again.",
        },
      ])
      setIsSubmitting(false)
      setActiveRunId(null)
      setAccessToken(null)
    }
  }, [activeRunId, run])

  async function submit(value: string) {
    const content = value.trim()
    if (!content || isSubmitting) return

    nextMessageId.current += 1
    setMessages((current) => [
      ...current,
      { id: `message-${nextMessageId.current}`, role: "user", content },
    ])
    setDraft("")
    setIsSubmitting(true)
    textareaRef.current?.focus()

    try {
      const designResponse = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, roomId, projectId }),
      })

      if (!designResponse.ok) {
        throw new Error("Failed to start design")
      }

      const designBody = (await designResponse.json()) as { runId?: string }
      if (!designBody.runId) {
        throw new Error("Missing run ID")
      }

      const tokenResponse = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: designBody.runId }),
      })

      if (!tokenResponse.ok) {
        throw new Error("Failed to create run token")
      }

      const tokenBody = (await tokenResponse.json()) as { token?: string }
      if (!tokenBody.token) {
        throw new Error("Missing access token")
      }

      nextMessageId.current += 1
      setMessages((current) => [
        ...current,
        {
          id: `message-${nextMessageId.current}`,
          role: "assistant",
          content: "Designing on the shared canvas…",
        },
      ])

      handledRunRef.current = null
      setAccessToken(tokenBody.token)
      setActiveRunId(designBody.runId)
    } catch {
      nextMessageId.current += 1
      setMessages((current) => [
        ...current,
        {
          id: `message-${nextMessageId.current}`,
          role: "assistant",
          content: "Could not start the design agent. Please try again.",
        },
      ])
      setIsSubmitting(false)
    }
  }

  function applyStarterPrompt(prompt: string) {
    setDraft(prompt)
    textareaRef.current?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return

    // Let IME composition finish before treating Enter as a submit.
    if (event.nativeEvent.isComposing) return

    event.preventDefault()
    void submit(draft)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {messages.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-4 py-6">
          <EmptyState onSelectStarterPrompt={applyStarterPrompt} />
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 px-4 py-4">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>
      )}

      <div className="border-t border-surface-border p-3">
        <div className="rounded-2xl border border-surface-border bg-elevated p-2 focus-within:border-subtle-border">
          <Textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the system you want to build..."
            aria-label="Message Ghost AI"
            disabled={isSubmitting}
            className="field-sizing-fixed min-h-[72px] max-h-40 resize-none overflow-y-auto rounded-xl border-0 bg-transparent px-2 py-1 text-sm text-copy-primary shadow-none placeholder:text-copy-faint focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-1 flex items-center justify-between gap-2 px-1">
            <p className="text-[0.65rem] text-copy-faint">
              Enter to send · Shift+Enter for a new line
            </p>
            <Button
              size="icon-sm"
              onClick={() => void submit(draft)}
              disabled={!draft.trim() || isSubmitting}
              aria-label="Send message"
              className="rounded-xl bg-ai text-copy-primary hover:bg-ai/90"
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  onSelectStarterPrompt,
}: {
  onSelectStarterPrompt: (prompt: string) => void
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
          Start with a system design
        </p>
        <p className="mt-1 text-sm leading-relaxed text-copy-muted">
          Describe what you want to build and Ghost AI maps it onto the shared
          canvas.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectStarterPrompt(prompt)}
            className="rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-ai-text transition-colors hover:bg-elevated"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
            : "border border-surface-border bg-elevated text-ai-text",
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
