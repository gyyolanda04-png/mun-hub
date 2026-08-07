"use client"

import { useMemo, useState } from "react"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Mic,
  UserCheck,
  Plus,
  ListOrdered,
  SlidersHorizontal,
} from "lucide-react"
import { useStore } from "@/lib/store"
import {
  STAGE_LABELS,
  STAGE_ORDER,
  type DebateStage,
  type Delegate,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PresentationMode({
  committeeId,
  onExit,
}: {
  committeeId: string
  onExit: () => void
}) {
  const { getCommittee, updateDebate } = useStore()
  const committee = getCommittee(committeeId)
  const [controlsOpen, setControlsOpen] = useState(true)

  const debate = committee?.debate
  const delegates = committee?.delegates ?? []

  const speaker = useMemo(
    () => delegates.find((d) => d.id === debate?.currentSpeakerId) ?? null,
    [delegates, debate?.currentSpeakerId],
  )
  const queue = useMemo(
    () =>
      (debate?.speakerQueue ?? [])
        .map((id) => delegates.find((d) => d.id === id))
        .filter((d): d is Delegate => Boolean(d)),
    [debate?.speakerQueue, delegates],
  )

  if (!committee || !debate) {
    return (
      <div className="dark flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p>Committee not found.</p>
        <Button variant="outline" onClick={onExit}>
          Exit
        </Button>
      </div>
    )
  }

  const stageIndex = STAGE_ORDER.indexOf(debate.stage)
  const showsResolution = ["general", "resolution", "amendment", "voting"].includes(
    debate.stage,
  )
  const showsAmendment = debate.stage === "amendment"

  function setStage(dir: 1 | -1) {
    const next = Math.min(
      STAGE_ORDER.length - 1,
      Math.max(0, stageIndex + dir),
    )
    updateDebate(committeeId, { stage: STAGE_ORDER[next] })
  }

  function advanceSpeaker() {
    const [next, ...rest] = debate.speakerQueue
    updateDebate(committeeId, {
      currentSpeakerId: next ?? null,
      speakerQueue: rest,
    })
  }

  function addToQueue(id: string) {
    if (!id) return
    if (debate.speakerQueue.includes(id) || debate.currentSpeakerId === id)
      return
    updateDebate(committeeId, {
      speakerQueue: [...debate.speakerQueue, id],
    })
  }

  const availableForQueue = delegates.filter(
    (d) => d.id !== debate.currentSpeakerId && !debate.speakerQueue.includes(d.id),
  )

  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-8">
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-lg font-semibold">
            {committee.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setControlsOpen((v) => !v)}
          >
            <SlidersHorizontal className="size-4" />
            {controlsOpen ? "Hide" : "Show"} controls
          </Button>
          <Button variant="outline" size="sm" onClick={onExit}>
            <X className="size-4" />
            Exit
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Display */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12 text-center md:px-12">
          <div className="flex flex-col items-center gap-3">
            <span className="rounded-full bg-primary/15 px-4 py-1.5 text-sm font-medium uppercase tracking-wide text-primary">
              {STAGE_LABELS[debate.stage]}
            </span>
            {showsResolution ? (
              <p className="text-lg text-muted-foreground">
                Resolution {debate.currentResolution}
                {showsAmendment
                  ? ` · Amendment ${debate.currentAmendment}`
                  : ""}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
              <Mic className="size-4" aria-hidden="true" />
              Current Speaker
            </span>
            <p className="font-serif text-5xl font-semibold text-balance md:text-7xl">
              {speaker ? speaker.delegation : "—"}
            </p>
            {speaker ? (
              <p className="text-xl text-muted-foreground">
                {speaker.name}
                {speaker.school ? ` · ${speaker.school}` : ""}
              </p>
            ) : null}
          </div>

          <div className="w-full max-w-md">
            <span className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
              <ListOrdered className="size-4" aria-hidden="true" />
              Speaker Queue
            </span>
            {queue.length === 0 ? (
              <p className="mt-3 text-muted-foreground">Queue is empty</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {queue.map((d, i) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-2 text-left"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-sm font-semibold tabular-nums text-secondary-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium">{d.delegation}</span>
                    <span className="ml-auto truncate text-sm text-muted-foreground">
                      {d.name}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Officer controls */}
        {controlsOpen ? (
          <aside className="flex w-full flex-col gap-6 border-t border-border bg-card/50 p-6 lg:w-96 lg:border-l lg:border-t-0">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Debate stage
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setStage(-1)}
                  disabled={stageIndex === 0}
                  aria-label="Previous stage"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-center text-sm font-medium">
                  {STAGE_LABELS[debate.stage]}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setStage(1)}
                  disabled={stageIndex === STAGE_ORDER.length - 1}
                  aria-label="Next stage"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {showsResolution ? (
              <Stepper
                label="Current resolution"
                value={debate.currentResolution}
                min={1}
                max={Math.max(1, debate.resolutions)}
                onChange={(v) =>
                  updateDebate(committeeId, { currentResolution: v })
                }
              />
            ) : null}

            {showsAmendment ? (
              <Stepper
                label="Current amendment"
                value={debate.currentAmendment}
                min={1}
                max={Math.max(1, debate.amendmentsPerResolution)}
                onChange={(v) =>
                  updateDebate(committeeId, { currentAmendment: v })
                }
              />
            ) : null}

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Speaker
              </h3>
              <Button onClick={advanceSpeaker} disabled={queue.length === 0}>
                <UserCheck className="size-4" />
                Next speaker from queue
              </Button>
              <div className="flex items-center gap-2">
                <Select value="" onValueChange={addToQueue}>
                  <SelectTrigger aria-label="Add delegate to queue">
                    <SelectValue placeholder="Add to queue…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableForQueue.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No delegates available
                      </SelectItem>
                    ) : (
                      availableForQueue.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.delegation}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Plus className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
              {speaker ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    updateDebate(committeeId, { currentSpeakerId: null })
                  }
                >
                  Clear current speaker
                </Button>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-center font-serif text-lg font-semibold tabular-nums">
          {value}
          <span className="text-sm text-muted-foreground"> / {max}</span>
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
