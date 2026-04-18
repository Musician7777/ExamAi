"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"

/**
 * AgentState — matches ElevenLabs BarVisualizer states
 * @typedef {"connecting"|"initializing"|"listening"|"speaking"|"thinking"} AgentState
 */

/**
 * useBarAnimator — creates a sweep/highlight animation for "connecting" and "initializing" states.
 * Returns a Set of highlighted bar indices.
 */
function useBarAnimator(state, barCount, speed = 100) {
  const [highlighted, setHighlighted] = useState(new Set())
  const intervalRef = useRef(null)
  const posRef = useRef(0)

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (state !== "connecting" && state !== "initializing") {
      setHighlighted(new Set())
      return
    }

    posRef.current = 0
    intervalRef.current = setInterval(() => {
      const pos = posRef.current % barCount
      const trail = state === "connecting" ? 3 : 2
      const indices = new Set()
      for (let i = 0; i <= trail; i++) {
        const idx = (pos - i + barCount) % barCount
        indices.add(idx)
      }
      setHighlighted(indices)
      posRef.current++
    }, speed)

    return () => clearInterval(intervalRef.current)
  }, [state, barCount, speed])

  return highlighted
}

/**
 * BarVisualizer — animated frequency bar visualizer with agent state support.
 *
 * Props:
 * - state: AgentState
 * - barCount: number (default 20)
 * - minHeight: number (default 15) — percentage
 * - maxHeight: number (default 90) — percentage
 * - demo: boolean (use animated demo mode instead of real audio)
 * - centerAlign: boolean
 * - className: string
 */
function BarVisualizer({
  state = "listening",
  barCount = 20,
  minHeight = 15,
  maxHeight = 90,
  demo = true,
  centerAlign = false,
  className,
  ...props
}) {
  const highlightedIndices = useBarAnimator(
    state === "connecting" || state === "initializing" ? state : null,
    barCount,
    state === "connecting" ? 80 : 120
  )

  // Generate animated bar heights for demo mode
  const [barHeights, setBarHeights] = useState(() =>
    Array.from({ length: barCount }, () => minHeight)
  )
  const frameRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    if (!demo) return

    let running = true
    const animate = () => {
      if (!running) return
      timeRef.current += 0.05

      const newHeights = Array.from({ length: barCount }, (_, i) => {
        const normalizedIndex = i / barCount
        const centerDistance = Math.abs(normalizedIndex - 0.5) * 2

        switch (state) {
          case "speaking": {
            const wave1 = Math.sin(timeRef.current * 3 + i * 0.5) * 0.5 + 0.5
            const wave2 = Math.sin(timeRef.current * 5 + i * 0.3) * 0.3 + 0.5
            const wave3 = Math.sin(timeRef.current * 2 + i * 0.8) * 0.2 + 0.5
            const combined = (wave1 + wave2 + wave3) / 3
            const centerBoost = 1 - centerDistance * 0.4
            const height = minHeight + (maxHeight - minHeight) * combined * centerBoost
            return height + (Math.random() * 8 - 4)
          }
          case "listening": {
            const wave = Math.sin(timeRef.current * 1.5 + i * 0.4) * 0.3 + 0.5
            const subtle = Math.sin(timeRef.current * 0.8 + i * 0.6) * 0.15 + 0.5
            const combined = (wave + subtle) / 2
            const height = minHeight + (maxHeight - minHeight) * combined * 0.45
            return height + (Math.random() * 3 - 1.5)
          }
          case "thinking": {
            const pulse = Math.sin(timeRef.current * 2) * 0.5 + 0.5
            const wave = Math.sin(timeRef.current * 1.2 + i * 0.3) * 0.2 + 0.5
            const combined = pulse * 0.6 + wave * 0.4
            const height = minHeight + (maxHeight - minHeight) * combined * 0.5
            return height
          }
          case "connecting":
          case "initializing": {
            const isHighlighted = highlightedIndices.has(i)
            return isHighlighted
              ? minHeight + (maxHeight - minHeight) * 0.6
              : minHeight + 4
          }
          default:
            return minHeight + Math.sin(timeRef.current * 0.5 + i * 0.2) * 3
        }
      })

      setBarHeights(newHeights)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      running = false
      cancelAnimationFrame(frameRef.current)
    }
  }, [demo, state, barCount, minHeight, maxHeight, highlightedIndices])

  // Color scheme based on state — uses site brand hue (239 indigo)
  const getBarColor = useCallback(
    (index, height) => {
      const intensity = (height - minHeight) / (maxHeight - minHeight)
      switch (state) {
        case "speaking":
          return `hsl(239, ${70 + intensity * 14}%, ${55 + intensity * 15}%)`
        case "listening":
          return `hsl(239, ${50 + intensity * 34}%, ${50 + intensity * 18}%)`
        case "thinking":
          return `hsl(270, ${45 + intensity * 30}%, ${45 + intensity * 20}%)`
        case "connecting":
        case "initializing": {
          const isHighlighted = highlightedIndices.has(index)
          return isHighlighted
            ? `hsl(239, 84%, 67%)`
            : `hsl(239, 25%, 25%)`
        }
        default:
          return `hsl(239, 40%, 45%)`
      }
    },
    [state, minHeight, maxHeight, highlightedIndices]
  )

  return (
    <div
      className={cn(
        "flex items-end gap-[2px] w-full",
        centerAlign ? "justify-center" : "justify-between",
        className
      )}
      role="img"
      aria-label={`Audio visualizer — ${state}`}
      {...props}
    >
      {barHeights.map((height, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-all duration-75"
          style={{
            height: `${Math.max(minHeight, Math.min(maxHeight, height))}%`,
            backgroundColor: getBarColor(i, height),
            maxWidth: "12px",
            minWidth: "2px",
            opacity: state === "connecting" || state === "initializing"
              ? highlightedIndices.has(i) ? 1 : 0.35
              : 0.85 + (height / maxHeight) * 0.15,
          }}
        />
      ))}
    </div>
  )
}

export { BarVisualizer, useBarAnimator }
