"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { useOthers } from "@liveblocks/react/suspense"

import { cn } from "@/lib/utils"

const MAX_VISIBLE_COLLABORATORS = 5

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

interface CollaboratorAvatarProps {
  name: string
  avatar: string
  className?: string
}

function CollaboratorAvatar({ name, avatar, className }: CollaboratorAvatarProps) {
  return (
    <span
      title={name}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-[0.7rem] font-medium text-copy-secondary ring-2 ring-surface",
        className,
      )}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  )
}

export function PresenceAvatars() {
  const { user } = useUser()
  const others = useOthers()

  const currentUserId = user?.id
  const collaborators = others.filter((other) => other.id !== currentUserId)
  const visibleCollaborators = collaborators.slice(
    0,
    MAX_VISIBLE_COLLABORATORS,
  )
  const overflowCount = collaborators.length - visibleCollaborators.length

  return (
    <div
      role="group"
      aria-label="Room participants"
      className="flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 p-1 shadow-lg backdrop-blur-sm"
    >
      {collaborators.length > 0 ? (
        <>
          <div className="flex items-center">
            {visibleCollaborators.map((other, index) => (
              <CollaboratorAvatar
                key={other.connectionId}
                name={other.info?.name ?? ""}
                avatar={other.info?.avatar ?? ""}
                className={index > 0 ? "-ml-2" : undefined}
              />
            ))}
            {overflowCount > 0 ? (
              <span className="-ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle text-[0.7rem] font-medium text-copy-secondary ring-2 ring-surface">
                +{overflowCount}
              </span>
            ) : null}
          </div>
          <span aria-hidden className="h-6 w-px bg-surface-border" />
        </>
      ) : null}
      <span className="flex h-8 w-8 items-center justify-center">
        <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
      </span>
    </div>
  )
}
