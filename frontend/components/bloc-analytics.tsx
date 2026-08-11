"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { useStore } from "@/lib/store"
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

interface BlocStat {
  bloc: string
  delegates: number
  speeches: number
  pois: number
  submitted: number
  approved: number
  entertaining: number
  passed: number
  failed: number
}

const UNASSIGNED = "Unassigned"

/**
 * Blocs (F7 + chair-managed): define blocs, assign delegates, and see
 * analytics — average speeches, participation, and voting by bloc.
 */
export function BlocAnalytics({ committeeId }: { committeeId: string }) {
  const { getCommittee, addBloc, removeBloc, setDelegateBloc } = useStore()
  const committee = getCommittee(committeeId)
  const [newBloc, setNewBloc] = useState("")

  if (!committee) return null

  const { delegates, amendments, blocs } = committee

  function addNewBloc() {
    const name = newBloc.trim()
    if (!name) return
    addBloc(committeeId, name)
    setNewBloc("")
  }

  // ---- analytics ----
  const byId = new Map(delegates.map((d) => [d.id, d]))
  const stats = new Map<string, BlocStat>()
  const ensure = (bloc: string): BlocStat => {
    let s = stats.get(bloc)
    if (!s) {
      s = {
        bloc,
        delegates: 0,
        speeches: 0,
        pois: 0,
        submitted: 0,
        approved: 0,
        entertaining: 0,
        passed: 0,
        failed: 0,
      }
      stats.set(bloc, s)
    }
    return s
  }
  for (const d of delegates) {
    const s = ensure(d.bloc?.trim() || UNASSIGNED)
    s.delegates += 1
    s.speeches += d.speeches
    s.pois += d.pois
  }
  for (const a of amendments) {
    const d = a.submitterId ? byId.get(a.submitterId) : undefined
    const s = ensure(d?.bloc?.trim() || UNASSIGNED)
    s.submitted += 1
    if (a.status === "PASSED") s.passed += 1
    else if (a.status === "FAILED") s.failed += 1
    else if (a.status === "APPROVED") s.approved += 1
    else if (a.status === "ENTERTAINING") s.entertaining += 1
  }
  const rows = [...stats.values()].sort((a, b) => {
    if (a.bloc === UNASSIGNED) return 1
    if (b.bloc === UNASSIGNED) return -1
    return a.bloc.localeCompare(b.bloc)
  })

  return (
    <div className="flex flex-col gap-5">
      {/* Manage bloc names */}
      <Card className="flex flex-col gap-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">Blocs</h3>
        <div className="flex flex-wrap items-center gap-2">
          {blocs.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              No blocs yet — add one below, then assign delegates.
            </span>
          ) : (
            blocs.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-sm"
              >
                {b}
                <button
                  type="button"
                  aria-label={`Remove ${b}`}
                  onClick={() => removeBloc(committeeId, b)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newBloc}
            onChange={(e) => setNewBloc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addNewBloc()
            }}
            placeholder="New bloc name, e.g. Western Bloc"
            className="max-w-xs"
          />
          <Button onClick={addNewBloc} disabled={!newBloc.trim()}>
            <Plus className="size-4" />
            Add bloc
          </Button>
        </div>
      </Card>

      {/* Assign delegates to blocs */}
      {delegates.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Assign delegates</h3>
          </div>
          <div className="max-h-[45vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky top-0 bg-card">Delegation</TableHead>
                  <TableHead className="sticky top-0 bg-card">Bloc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegates.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{d.delegation || "—"}</p>
                      <p className="text-xs text-muted-foreground">{d.name}</p>
                    </TableCell>
                    <TableCell>
                      <select
                        value={d.bloc || ""}
                        onChange={(e) => setDelegateBloc(committeeId, d.id, e.target.value)}
                        className="h-9 w-full max-w-[220px] rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Unassigned</option>
                        {blocs.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Add delegates (Attendance tab) to assign them to blocs.
        </p>
      )}

      {/* Analytics */}
      {delegates.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">Bloc analytics</h3>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Bloc</TableHead>
                    <TableHead className="text-right">Delegates</TableHead>
                    <TableHead className="text-right">Avg speeches</TableHead>
                    <TableHead className="text-right">Speeches</TableHead>
                    <TableHead className="text-right">POIs</TableHead>
                    <TableHead className="text-right">Amendments</TableHead>
                    <TableHead className="text-right">Passed</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.bloc}>
                      <TableCell className="font-medium text-foreground">{r.bloc}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.delegates}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.delegates > 0 ? (r.speeches / r.delegates).toFixed(1) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.speeches}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.pois}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.submitted}</TableCell>
                      <TableCell className="text-right tabular-nums text-green-700 dark:text-green-400">
                        {r.passed}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-red-700 dark:text-red-400">
                        {r.failed}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
          <p className="px-1 text-xs text-muted-foreground">
            &ldquo;Voting by bloc&rdquo; aggregates amendment outcomes by the submitter&apos;s
            bloc. Amendments = total submitted; Passed/Failed are their ruled outcomes.
          </p>
        </div>
      ) : null}
    </div>
  )
}
