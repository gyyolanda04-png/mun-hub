"use client"

import { useStore } from "@/lib/store"
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
 * Bloc analytics (F7): average speeches per bloc, participation by bloc, and
 * voting by bloc (aggregated amendment outcomes by the submitter's bloc).
 */
export function BlocAnalytics({ committeeId }: { committeeId: string }) {
  const { getCommittee } = useStore()
  const committee = getCommittee(committeeId)
  if (!committee) return null

  const { delegates, amendments } = committee
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

  const hasBlocs = rows.some((r) => r.bloc !== UNASSIGNED)

  if (delegates.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Import delegates (with a Bloc column, or set blocs on the Attendance tab) to see
        analytics.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!hasBlocs ? (
        <Card className="border-dashed p-4 text-sm text-muted-foreground">
          No blocs assigned yet. Add a <span className="font-medium">Bloc</span> column to your
          import, or set a delegate&apos;s bloc when adding them — then each bloc&apos;s stats
          show here.
        </Card>
      ) : null}

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
                  <TableCell className="font-medium text-foreground">
                    {r.bloc}
                  </TableCell>
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
        &ldquo;Voting by bloc&rdquo; aggregates amendment outcomes by the submitter&apos;s bloc.
        Amendments = total submitted; Passed/Failed are their ruled outcomes.
      </p>
    </div>
  )
}
