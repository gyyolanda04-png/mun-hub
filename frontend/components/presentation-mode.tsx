"use client"

import { useMemo, useState } from "react"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Mic,
  UserCheck,
  ListOrdered,
  Plus,
  SlidersHorizontal,
} from "lucide-react"
import { useStore } from "@/lib/store"
import {
  STAGE_LABELS,
  STAGE_ORDER,
  AMENDMENT_TYPE_LABELS,
  type Delegate,
} from "@/lib/types"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { SpeechTimer } from "@/components/presentation-timer"
import { DelegateCombobox } from "@/components/delegate-combobox"

export function PresentationMode({
  committeeId,
  onExit,
}: {
  committeeId: string
  onExit: () => void
}) {
  const { getCommittee, updateDebate, incrementCounter } = useStore()
  const committee = getCommittee(committeeId)
  const [controlsOpen, setControlsOpen] = useState(true)
  // POI queue is presentation-local: delegates lined up to make a point of
  // information on the current speech. Each "+1" logs a POI and drops them.
  const [poiQueue, setPoiQueue] = useState<string[]>([])

  const debate = committee?.debate
  const delegates = committee?.delegates ?? []

  const speaker = useMemo(
    () => delegates.find((d) => d.id === debate?.currentSpeakerId) ?? null,
    [delegates, debate?.currentSpeakerId],
  )
  const speakerList = useMemo(
    () =>
      (debate?.speakerQueue ?? [])
        .map((id) => delegates.find((d) => d.id === id))
        .filter((d): d is Delegate => Boolean(d)),
    [debate?.speakerQueue, delegates],
  )
  const poiList = useMemo(
    () =>
      poiQueue
        .map((id) => delegates.find((d) => d.id === id))
        .filter((d): d is Delegate => Boolean(d)),
    [poiQueue, delegates],
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

  // Move to the next speaker. The outgoing speaker just finished their speech,
  // so count it, then promote the front of the queue.
  function nextSpeaker() {
    const outgoing = debate.currentSpeakerId
    if (outgoing) incrementCounter(committeeId, outgoing, "speeches", 1)
    const [next, ...rest] = debate.speakerQueue
    updateDebate(committeeId, {
      currentSpeakerId: next ?? null,
      speakerQueue: rest,
    })
    // A new speech means a fresh set of points of information.
    setPoiQueue([])
  }

  function addSpeaker(id: string) {
    if (!id) return
    if (debate.speakerQueue.includes(id) || debate.currentSpeakerId === id) return
    updateDebate(committeeId, {
      speakerQueue: [...debate.speakerQueue, id],
    })
  }

  function removeSpeaker(id: string) {
    updateDebate(committeeId, {
      speakerQueue: debate.speakerQueue.filter((x) => x !== id),
    })
  }

  const availableSpeakers = delegates.filter(
    (d) => d.id !== debate.currentSpeakerId && !debate.speakerQueue.includes(d.id),
  )

  function addPoi(id: string) {
    if (!id) return
    setPoiQueue((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  // A queued delegate got to make their point: log the POI and remove them.
  function recordPoi(id: string) {
    incrementCounter(committeeId, id, "pois", 1)
    setPoiQueue((prev) => prev.filter((x) => x !== id))
    const d = delegates.find((x) => x.id === id)
    toast.success(`Point of information recorded${d ? ` · ${d.delegation}` : ""}`)
  }

  function removePoi(id: string) {
    setPoiQueue((prev) => prev.filter((x) => x !== id))
  }

  const availableForPoi = delegates.filter(
    (d) => d.id !== debate.currentSpeakerId && !poiQueue.includes(d.id),
  )

  const presentedAmendment =
    committee.amendments.find((a) => a.id === committee.presentedAmendmentId) ?? null

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
          {presentedAmendment ? (
            <div className="w-full max-w-3xl rounded-xl border border-primary/40 bg-card px-8 py-6 text-left">
              <h2 className="font-serif text-3xl font-semibold md:text-4xl">
                Amendment
                {presentedAmendment.friendly ? " (Friendly)" : ""}
              </h2>
              <p className="mt-3 text-lg">
                <span className="text-muted-foreground">Submitted by: </span>
                <span className="font-medium">{presentedAmendment.submitter || "—"}</span>
              </p>
              <p className="mt-1 text-lg font-medium">
                {AMENDMENT_TYPE_LABELS[presentedAmendment.type]}
                {presentedAmendment.clauseRef ? ` ${presentedAmendment.clauseRef}` : ""}
              </p>
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                Amendment Content
              </p>
              <p className="mt-1 whitespace-pre-wrap text-lg leading-relaxed">
                {presentedAmendment.text}
              </p>
            </div>
          ) : null}
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

          <div className="flex w-full flex-col items-center justify-center gap-10 lg:flex-row lg:items-start lg:gap-16">
            <div className="flex flex-col items-center gap-6">
              <SpeechTimer onExpire={nextSpeaker} />

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
            </div>

            <div className="w-full max-w-md">
              <span className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                <ListOrdered className="size-4" aria-hidden="true" />
                Points of Information
              </span>
              {poiList.length === 0 ? (
                <p className="mt-3 text-muted-foreground">No points of information</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-2">
                  {poiList.map((d, i) => (
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

            {/* Speakers: advancing counts the outgoing speaker's speech. */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Speakers
              </h3>
              <Button
                onClick={nextSpeaker}
                disabled={!speaker && debate.speakerQueue.length === 0}
              >
                <UserCheck className="size-4" />
                Next speaker (+1 speech)
              </Button>
              <DelegateCombobox
                delegates={availableSpeakers}
                value={null}
                onChange={(id) => {
                  if (id) addSpeaker(id)
                }}
                placeholder="Add delegate to speakers…"
              />
              {speakerList.length > 0 ? (
                <ol className="flex flex-col gap-2">
                  {speakerList.map((d, i) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left"
                    >
                      <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums text-secondary-foreground">
                        {i + 1}
                      </span>
                      <span className="truncate text-sm font-medium">
                        {d.delegation}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-7"
                        onClick={() => removeSpeaker(d.id)}
                        aria-label={`Remove ${d.delegation} from speakers`}
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ol>
              ) : null}
              {speaker ? (
                <Button
                  variant="outline"
                  onClick={() => updateDebate(committeeId, { currentSpeakerId: null })}
                >
                  Clear current speaker
                </Button>
              ) : null}
            </div>

            {/* Points of information: "+1" logs a POI and removes the delegate. */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Points of Information
              </h3>
              <DelegateCombobox
                delegates={availableForPoi}
                value={null}
                onChange={(id) => {
                  if (id) addPoi(id)
                }}
                placeholder="Add delegate to POI queue…"
              />
              {poiList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No delegates queued for points of information.
                </p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {poiList.map((d, i) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left"
                    >
                      <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums text-secondary-foreground">
                        {i + 1}
                      </span>
                      <span className="truncate text-sm font-medium">
                        {d.delegation}
                      </span>
                      <Button
                        size="sm"
                        className="ml-auto h-7 px-2"
                        onClick={() => recordPoi(d.id)}
                      >
                        <Plus className="size-3.5" />
                        POI
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => removePoi(d.id)}
                        aria-label={`Remove ${d.delegation} from POI queue`}
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ol>
              )}
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
