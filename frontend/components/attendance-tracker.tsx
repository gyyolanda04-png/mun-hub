"use client"

import { useState } from "react"
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

export function AttendanceTracker({ committeeId }: { committeeId: string }) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MajorityInfo delegates={delegates} attendanceSessions={attendanceSessions} />
        <AddDelegateDialog committeeId={committeeId} />
      </div>

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
    <Card className="flex flex-wrap items-center gap-5 px-4 py-3">
      <Stat label="Voting members" value={count} />
      <Stat label="Simple majority (>50%)" value={simple} />
      <Stat label="Two-thirds (≥67%)" value={twoThirds} />
      {attendanceSessions.length > 0 ? (
        <Select value={basis} onValueChange={(v) => setBasis(v ?? "all")}>
          <SelectTrigger className="h-8 w-[170px] text-xs" aria-label="Voting basis">
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
      ) : null}
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-serif text-xl font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  )
}
