"use client"

import { useEffect, useState } from "react"
import { Calculator, Clock, FileText, ScrollText, Split } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { calculateTiming, type DebateState, type TimingResult } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type InputKey =
  | "totalDuration"
  | "resolutions"
  | "openingSpeech"
  | "closingSpeech"
  | "amendmentsPerResolution"

interface Computed {
  result: TimingResult
  totalDuration: number
  resolutions: number
  amendmentsPerResolution: number
}

function formatMinutes(mins: number): string {
  if (!isFinite(mins) || mins <= 0) return "0m"
  const total = Math.round(mins)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

const INPUTS: { key: InputKey; label: string; hint: string }[] = [
  { key: "totalDuration", label: "Total committee duration", hint: "minutes" },
  { key: "resolutions", label: "Number of resolutions", hint: "count" },
  { key: "openingSpeech", label: "Opening speech (per resolution)", hint: "minutes" },
  { key: "closingSpeech", label: "Closing speech (per resolution)", hint: "minutes" },
  {
    key: "amendmentsPerResolution",
    label: "Amendments per resolution",
    hint: "count",
  },
]

function snapshot(d: DebateState): Record<InputKey, number> {
  return {
    totalDuration: d.totalDuration,
    resolutions: d.resolutions,
    openingSpeech: d.openingSpeech,
    closingSpeech: d.closingSpeech,
    amendmentsPerResolution: d.amendmentsPerResolution,
  }
}

export function TimingCalculator({ committeeId }: { committeeId: string }) {
  const { getCommittee, updateDebate } = useStore()
  const committee = getCommittee(committeeId)
  const debate = committee?.debate

  // Inputs are kept in local state so typing is instant — nothing is sent to
  // the server (and nothing recalculates) until "Calculate" is pressed.
  const [inputs, setInputs] = useState<Record<InputKey, number> | null>(null)
  const [computed, setComputed] = useState<Computed | null>(null)

  // Seed inputs + an initial result from the saved schedule, once.
  useEffect(() => {
    if (debate && inputs === null) {
      setInputs(snapshot(debate))
      setComputed({
        result: calculateTiming(debate),
        totalDuration: debate.totalDuration,
        resolutions: debate.resolutions,
        amendmentsPerResolution: debate.amendmentsPerResolution,
      })
    }
  }, [debate, inputs])

  if (!committee || !debate || !inputs) return null

  function setField(key: InputKey, value: number) {
    setInputs((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function calculate() {
    if (!inputs) return
    setComputed({
      result: calculateTiming({ ...debate!, ...inputs }),
      totalDuration: inputs.totalDuration,
      resolutions: inputs.resolutions,
      amendmentsPerResolution: inputs.amendmentsPerResolution,
    })
    // Persist the schedule once (not on every keystroke).
    updateDebate(committeeId, inputs)
    toast.success("Schedule calculated and saved.")
  }

  const res = computed?.result
  const resolutions = Math.max(1, computed?.resolutions ?? 1)
  const amendments = Math.max(1, computed?.amendmentsPerResolution ?? 1)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <Card className="flex flex-col gap-4 p-5 lg:col-span-2">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Schedule inputs
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your conference schedule, then press Calculate.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {INPUTS.map(({ key, label, hint }) => (
            <div key={key} className="flex flex-col gap-2">
              <Label htmlFor={key}>{label}</Label>
              <div className="relative">
                <Input
                  id={key}
                  type="number"
                  min={key === "resolutions" || key === "amendmentsPerResolution" ? 1 : 0}
                  value={inputs[key]}
                  onChange={(e) =>
                    setField(key, Math.max(0, Number(e.target.value) || 0))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") calculate()
                  }}
                  className="pr-16"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {hint}
                </span>
              </div>
            </div>
          ))}
          <Button onClick={calculate} className="mt-1 self-start">
            <Calculator className="size-4" />
            Calculate
          </Button>
        </div>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3 lg:content-start">
        {res ? (
          <>
            <ResultCard
              icon={Clock}
              label="Time available for debate"
              value={formatMinutes(res.debateTime)}
              detail={`${computed!.totalDuration}m total − ${formatMinutes(res.totalSpeechTime)} of speeches (${resolutions}× opening + closing)`}
              highlight
            />
            <ResultCard
              icon={ScrollText}
              label="Time per resolution"
              value={formatMinutes(res.timePerResolution)}
              detail={`Across ${resolutions} resolution${resolutions === 1 ? "" : "s"}`}
            />
            <ResultCard
              icon={Split}
              label="Amendment debate time"
              value={formatMinutes(res.amendmentDebateTime)}
              detail="Per resolution (≈40% of resolution time)"
            />
            <ResultCard
              icon={FileText}
              label="Time per amendment"
              value={formatMinutes(res.timePerAmendment)}
              detail={`Across ${amendments} amendment${amendments === 1 ? "" : "s"}`}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}

function ResultCard({
  icon: Icon,
  label,
  value,
  detail,
  highlight,
}: {
  icon: typeof Clock
  label: string
  value: string
  detail: string
  highlight?: boolean
}) {
  return (
    <Card
      className={`flex flex-col gap-2 p-5 ${
        highlight ? "border-primary/40 bg-primary/5" : ""
      }`}
    >
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </span>
      <span className="font-serif text-3xl font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </Card>
  )
}
