"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"

const PRESETS = [60, 90, 120]

function fmt(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

/**
 * Speech timer (F6): large countdown, 60/90/120s presets, and auto-advance to
 * the next speaker when it hits zero (via onExpire).
 */
export function SpeechTimer({ onExpire }: { onExpire?: () => void }) {
  const [duration, setDuration] = useState(60)
  const [remaining, setRemaining] = useState(60)
  const [running, setRunning] = useState(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  // Tick down one second at a time while running.
  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
  }, [running, remaining])

  // Fire once when the countdown reaches zero.
  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false)
      onExpireRef.current?.()
    }
  }, [remaining, running])

  function selectPreset(sec: number) {
    setDuration(sec)
    setRemaining(sec)
    setRunning(false)
  }

  function reset() {
    setRemaining(duration)
    setRunning(false)
  }

  const danger = remaining <= 10

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-sm uppercase tracking-widest text-muted-foreground">
        Speech Timer
      </span>
      <p
        className={`font-serif text-6xl font-semibold tabular-nums md:text-7xl ${
          danger ? "text-destructive" : "text-foreground"
        }`}
      >
        {fmt(remaining)}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p}
            variant={duration === p ? "default" : "outline"}
            size="sm"
            onClick={() => selectPreset(p)}
          >
            {p}s
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => setRunning((r) => !r)} disabled={remaining === 0}>
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pause" : "Start"}
        </Button>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" />
          Reset
        </Button>
        {onExpire ? (
          <Button
            variant="outline"
            onClick={() => {
              setRunning(false)
              onExpire()
              setRemaining(duration)
            }}
          >
            <SkipForward className="size-4" />
            Next
          </Button>
        ) : null}
      </div>
    </div>
  )
}
