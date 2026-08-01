"use client"

import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

  if (delegates.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Import delegates below to start tracking attendance.
      </p>
    )
  }

  return (
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
  )
}
