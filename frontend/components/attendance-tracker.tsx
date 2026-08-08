"use client"

import { useState, type ReactNode } from "react"
import { Check, Plus, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddDelegateDialog } from "@/components/add-delegate-dialog"
import { toast } from "sonner"

export function AttendanceTracker({
  committeeId,
  uploadSlot,
}: {
  committeeId: string
  uploadSlot?: ReactNode
}) {
  const { getCommittee, setAttendance, addAttendanceSession, removeAttendanceSession } =
    useStore()
  const committee = getCommittee(committeeId)
  const [addingSession, setAddingSession] = useState(false)
  const [newSession, setNewSession] = useState("")

  if (!committee) return null
  const { delegates, attendanceSessions } = committee

  function submitNewSession() {
    const trimmed = newSession.trim()
    if (!trimmed) {
      toast.error("Enter a session name.")
      return
    }
    if (attendanceSessions.includes(trimmed)) {
      toast.error("That session already exists.")
      return
    }
    addAttendanceSession(committeeId, trimmed)
    setNewSession("")
    setAddingSession(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <AddDelegateDialog committeeId={committeeId} />
        {delegates.length > 0 ? uploadSlot : null}
      </div>

      <MajorityInfo delegates={delegates} attendanceSessions={attendanceSessions} />

      {delegates.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Import delegates below, or add one manually, to start tracking attendance.
        </p>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="max-h-[65vh] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 top-0 z-20 border-r border-border bg-card">
                Delegation
              </TableHead>
              {attendanceSessions.map((session) => (
                <TableHead
                  key={session}
                  className="group sticky top-0 z-10 bg-card text-center"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {session}
                    <button
                      type="button"
                      aria-label={`Remove session ${session}`}
                      onClick={() => removeAttendanceSession(committeeId, session)}
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                </TableHead>
              ))}
              <TableHead className="sticky top-0 z-10 bg-card">
                {addingSession ? (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      value={newSession}
                      onChange={(e) => setNewSession(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitNewSession()
                        if (e.key === "Escape") {
                          setAddingSession(false)
                          setNewSession("")
                        }
                      }}
                      placeholder="Session name"
                      className="h-7 w-32 text-xs"
                    />
                    <Button size="sm" className="h-7 px-2" onClick={submitNewSession}>
                      Add
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 font-normal text-muted-foreground"
                    onClick={() => setAddingSession(true)}
                  >
                    <Plus className="size-3.5" />
                    Session
                  </Button>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {delegates.map((d) => {
              const total = attendanceSessions.filter((s) => d.attendance[s]).length
              return (
                <TableRow key={d.id}>
                  <TableCell className="sticky left-0 z-10 border-r border-border bg-card">
                    <p className="font-medium text-foreground">{d.delegation || "—"}</p>
                    <p className="text-xs text-muted-foreground">{d.name}</p>
                  </TableCell>
                  {attendanceSessions.map((session) => {
                    const present = d.attendance[session] ?? false
                    return (
                      <TableCell key={session} className="text-center">
                        <button
                          type="button"
                          aria-label={`${d.delegation || d.name}: ${session} — ${present ? "present, click to mark absent" : "absent, click to mark present"}`}
                          onClick={() =>
                            setAttendance(committeeId, d.id, session, !present)
                          }
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-md border transition-colors",
                            present
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-transparent hover:border-primary/50 hover:bg-secondary/60",
                          )}
                        >
                          <Check className="size-4" strokeWidth={3} />
                        </button>
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-xs tabular-nums text-muted-foreground">
                    {attendanceSessions.length > 0
                      ? `${total}/${attendanceSessions.length}`
                      : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
          </div>
        </Card>
      )}
    </div>
  )
}

function computeMajorities(n: number): { simple: number; twoThirds: number } {
  if (n <= 0) return { simple: 0, twoThirds: 0 }
  return {
    // Strictly more than half.
    simple: Math.floor(n / 2) + 1,
    // At least two-thirds.
    twoThirds: Math.ceil((2 * n) / 3),
  }
}

/**
 * Majority calculator (F3). Voting members defaults to the full roster, but
 * officers can base it on who was present in a given attendance session.
 */
function MajorityInfo({
  delegates,
  attendanceSessions,
}: {
  delegates: { attendance: Record<string, boolean> }[]
  attendanceSessions: string[]
}) {
  const [basis, setBasis] = useState<string>("all")
  const count =
    basis === "all"
      ? delegates.length
      : delegates.filter((d) => d.attendance[basis]).length
  const { simple, twoThirds } = computeMajorities(count)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Pill fraction={1} value={count} label="Voting members" />
      <Pill fraction={2 / 3} value={twoThirds} label="Two-thirds (67%)" />
      <Pill fraction={1 / 2} value={simple} label="Simple majority (50%)" />
      {attendanceSessions.length > 0 ? (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Based on</span>
          <Select value={basis} onValueChange={(v) => setBasis(v ?? "all")}>
            <SelectTrigger className="h-8 w-[180px] text-xs" aria-label="Voting basis">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All delegates</SelectItem>
              {attendanceSessions.map((s) => (
                <SelectItem key={s} value={s}>
                  Present: {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  )
}

/** A little pie gauge filled to `fraction` of a full circle. */
function Pie({ fraction }: { fraction: number }) {
  const r = 12
  const cx = 14
  const cy = 14
  const f = Math.max(0, Math.min(1, fraction))
  let wedge = null
  if (f >= 1) {
    wedge = <circle cx={cx} cy={cy} r={r} className="fill-primary" />
  } else if (f > 0) {
    const a = 2 * Math.PI * f - Math.PI / 2
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    const large = f > 0.5 ? 1 : 0
    wedge = (
      <path
        d={`M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 ${large} 1 ${x.toFixed(2)},${y.toFixed(2)} Z`}
        className="fill-primary"
      />
    )
  }
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} className="fill-secondary" />
      {wedge}
    </svg>
  )
}

function Pill({
  fraction,
  value,
  label,
}: {
  fraction: number
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
      <Pie fraction={fraction} />
      <div className="flex flex-col leading-tight">
        <span className="font-serif text-xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  )
}
