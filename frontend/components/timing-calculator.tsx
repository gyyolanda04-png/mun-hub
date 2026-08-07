"use client"

import { useMemo } from "react"
import { Clock, FileText, ScrollText, Split } from "lucide-react"
import { useStore } from "@/lib/store"
import { calculateTiming, type DebateState } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function formatMinutes(mins: number): string {
  if (!isFinite(mins) || mins <= 0) return "0m"
  const total = Math.round(mins)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

const INPUTS: {
  key: keyof Pick<
    DebateState,
    | "totalDuration"
    | "resolutions"
    | "openingSpeech"
    | "closingSpeech"
    | "amendmentsPerResolution"
  >
  label: string
  hint: string
}[] = [
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

export function TimingCalculator({ committeeId }: { committeeId: string }) {
  const { getCommittee, updateDebate } = useStore()
  const committee = getCommittee(committeeId)
  const debate = committee?.debate

  const result = useMemo(
    () => (debate ? calculateTiming(debate) : null),
    [debate],
  )

  if (!committee || !debate || !result) return null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <Card className="flex flex-col gap-4 p-5 lg:col-span-2">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Schedule inputs
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your conference schedule to calculate debate allocations.
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
                  value={debate[key]}
                  onChange={(e) =>
                    updateDebate(committeeId, {
                      [key]: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="pr-16"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {hint}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3 lg:content-start">
        <ResultCard
          icon={Clock}
          label="Time available for debate"
          value={formatMinutes(result.debateTime)}
          detail={`${debate.totalDuration}m total − ${formatMinutes(result.totalSpeechTime)} of speeches (${Math.max(1, debate.resolutions)}× opening + closing)`}
          highlight
        />
        <ResultCard
          icon={ScrollText}
          label="Time per resolution"
          value={formatMinutes(result.timePerResolution)}
          detail={`Across ${Math.max(1, debate.resolutions)} resolution${debate.resolutions === 1 ? "" : "s"}`}
        />
        <ResultCard
          icon={Split}
          label="Amendment debate time"
          value={formatMinutes(result.amendmentDebateTime)}
          detail="Per resolution (≈40% of resolution time)"
        />
        <ResultCard
          icon={FileText}
          label="Time per amendment"
          value={formatMinutes(result.timePerAmendment)}
          detail={`Across ${Math.max(1, debate.amendmentsPerResolution)} amendment${debate.amendmentsPerResolution === 1 ? "" : "s"}`}
        />
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
