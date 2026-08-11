"use client"

import { useState } from "react"
import { Plus, X, Trash2, Check } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import type { Delegate } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  passed: number
  failed: number
}

const UNASSIGNED = "Unassigned"

export function BlocAnalytics({ committeeId }: { committeeId: string }) {
  const { getCommittee, removeBloc, setDelegateBloc } = useStore()
  const committee = getCommittee(committeeId)
  if (!committee) return null

  const { delegates, amendments, blocs } = committee
  const unassigned = delegates.filter((d) => !d.bloc?.trim()).length

  // ---- analytics ----
  const byId = new Map(delegates.map((d) => [d.id, d]))
  const stats = new Map<string, BlocStat>()
  const ensure = (bloc: string): BlocStat => {
    let s = stats.get(bloc)
    if (!s) {
      s = { bloc, delegates: 0, speeches: 0, pois: 0, submitted: 0, passed: 0, failed: 0 }
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
  }
  const rows = [...stats.values()].sort((a, b) => {
    if (a.bloc === UNASSIGNED) return 1
    if (b.bloc === UNASSIGNED) return -1
    return a.bloc.localeCompare(b.bloc)
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Blocs</h3>
          <p className="text-sm text-muted-foreground">
            {blocs.length} bloc{blocs.length === 1 ? "" : "s"} · {unassigned} unassigned
          </p>
        </div>
        <NewBlocDialog committeeId={committeeId} delegates={delegates} blocs={blocs} />
      </div>

      {blocs.length === 0 ? (
        <Card className="border-dashed py-12 text-center text-sm text-muted-foreground">
          No blocs yet. Create one and choose its members.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {blocs.map((b) => (
            <BlocCard
              key={b}
              committeeId={committeeId}
              bloc={b}
              delegates={delegates}
              onDelete={() => removeBloc(committeeId, b)}
              onAdd={(id) => setDelegateBloc(committeeId, id, b)}
              onRemove={(id) => setDelegateBloc(committeeId, id, "")}
            />
          ))}
        </div>
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
            &ldquo;Voting by bloc&rdquo; aggregates amendment outcomes by the submitter&apos;s bloc.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function BlocCard({
  committeeId,
  bloc,
  delegates,
  onDelete,
  onAdd,
  onRemove,
}: {
  committeeId: string
  bloc: string
  delegates: Delegate[]
  onDelete: () => void
  onAdd: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [search, setSearch] = useState("")
  const members = delegates.filter((d) => d.bloc?.trim() === bloc)
  const q = search.trim().toLowerCase()
  const matches = q
    ? delegates.filter(
        (d) =>
          d.bloc?.trim() !== bloc &&
          (d.delegation.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)),
      )
    : []

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">
          {bloc}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            ({members.length})
          </span>
        </h4>
        <Button size="icon-sm" variant="ghost" aria-label={`Delete ${bloc}`} onClick={onDelete}>
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {members.length === 0 ? (
          <span className="text-sm text-muted-foreground">No members yet.</span>
        ) : (
          members.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-sm"
            >
              {d.delegation}
              <button
                type="button"
                aria-label={`Remove ${d.delegation}`}
                onClick={() => onRemove(d.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="relative">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Add a delegate to this bloc…"
          className="h-8 text-sm"
        />
        {matches.length > 0 ? (
          <div className="mt-1 max-h-40 overflow-auto rounded-md border border-border">
            {matches.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  onAdd(d.id)
                  setSearch("")
                }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-secondary"
              >
                <span>
                  {d.delegation}
                  {d.bloc?.trim() ? (
                    <span className="ml-2 text-xs italic text-muted-foreground">
                      in {d.bloc}
                    </span>
                  ) : null}
                </span>
                <Plus className="size-3.5 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  )
}

function NewBlocDialog({
  committeeId,
  delegates,
  blocs,
}: {
  committeeId: string
  delegates: Delegate[]
  blocs: string[]
}) {
  const { addBloc, setDelegateBloc } = useStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function create() {
    const nm = name.trim()
    if (!nm) {
      toast.error("Enter a bloc name.")
      return
    }
    if (blocs.includes(nm)) {
      toast.error("That bloc already exists.")
      return
    }
    addBloc(committeeId, nm)
    selected.forEach((id) => setDelegateBloc(committeeId, id, nm))
    toast.success(`Bloc "${nm}" created with ${selected.size} member${selected.size === 1 ? "" : "s"}.`)
    setName("")
    setSearch("")
    setSelected(new Set())
    setOpen(false)
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? delegates.filter(
        (d) =>
          d.delegation.toLowerCase().includes(q) || d.name.toLowerCase().includes(q),
      )
    : delegates
  const selectedDelegates = delegates.filter((d) => selected.has(d.id))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New bloc
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New bloc</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bloc-name">Bloc name</Label>
            <Input
              id="bloc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Western Bloc"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Available delegates */}
            <div className="flex flex-col gap-2">
              <Label>Delegates</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
              />
              <div className="max-h-64 overflow-auto rounded-md border border-border">
                {filtered.map((d) => {
                  const isSel = selected.has(d.id)
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggle(d.id)}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-secondary"
                    >
                      <span>
                        {d.delegation}
                        {d.bloc?.trim() && d.bloc.trim() !== name.trim() ? (
                          <span className="ml-2 text-xs italic text-muted-foreground">
                            in {d.bloc}
                          </span>
                        ) : null}
                      </span>
                      {isSel ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <Plus className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected members */}
            <div className="flex flex-col gap-2">
              <Label>In this bloc ({selected.size})</Label>
              <div className="flex max-h-[19rem] flex-col gap-1 overflow-auto rounded-md border border-border p-2">
                {selectedDelegates.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">
                    No one added yet. Click delegates on the left to add them.
                  </p>
                ) : (
                  selectedDelegates.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-secondary/60"
                    >
                      <span>{d.delegation}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${d.delegation}`}
                        onClick={() => toggle(d.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={create}>Create bloc</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
