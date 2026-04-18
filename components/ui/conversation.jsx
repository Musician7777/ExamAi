"use client"

import { useRef, useEffect, useState, useCallback, createContext, useContext } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * ConversationContext — provides scroll control to child components
 */
const ConversationContext = createContext({
  isAtBottom: true,
  scrollToBottom: () => {},
})

/**
 * Conversation — scrolling container with sticky-to-bottom behavior
 */
function Conversation({ className, children, ...props }) {
  const scrollRef = useRef(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const checkIfAtBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 40
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    setIsAtBottom(atBottom)
  }, [])

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  // Auto-scroll when new content is added and user is at bottom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const observer = new MutationObserver(() => {
      if (isAtBottom) {
        scrollToBottom("smooth")
      }
    })

    observer.observe(el, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [isAtBottom, scrollToBottom])

  return (
    <ConversationContext.Provider value={{ isAtBottom, scrollToBottom }}>
      <div
        className={cn("relative flex h-full flex-col overflow-hidden", className)}
        {...props}
      >
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={checkIfAtBottom}
        >
          {children}
        </div>
      </div>
    </ConversationContext.Provider>
  )
}

/**
 * ConversationContent — container for messages
 */
function ConversationContent({ className, children, ...props }) {
  return (
    <div
      className={cn("flex min-w-0 flex-col gap-2 p-6 pb-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * ConversationEmptyState — shown when there are no messages
 */
function ConversationEmptyState({ icon, title, description, className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}
      {title && (
        <h3 className="text-base font-semibold text-foreground">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {children}
    </div>
  )
}

/**
 * ConversationScrollButton — appears when user has scrolled up
 */
function ConversationScrollButton({ className, ...props }) {
  const { isAtBottom, scrollToBottom } = useContext(ConversationContext)

  if (isAtBottom) return null

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
      <Button
        variant="secondary"
        size="sm"
        className={cn(
          "rounded-full shadow-lg border text-xs gap-1 h-7 px-3",
          className
        )}
        onClick={() => scrollToBottom("smooth")}
        {...props}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        Scroll to bottom
      </Button>
    </div>
  )
}

export {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
}
