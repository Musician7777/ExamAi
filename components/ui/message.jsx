"use client"

import { cn } from "@/lib/utils"

/**
 * Message — composable message container with role-based styling.
 * Props:
 * - from: "user" | "assistant"
 * - className, children
 */
function Message({ from = "user", className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex w-full gap-3",
        from === "user" ? "flex-row-reverse" : "flex-row",
        className
      )}
      data-role={from}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * MessageContent — wraps the text/content of a message with role-appropriate styles.
 */
function MessageContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex max-w-[85%] min-w-0 flex-col gap-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Message, MessageContent }
