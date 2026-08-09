"use client"

import { useMemo, useState } from "react"
import {
  Mic,
  MessageCircleQuestion,
  Minus,
  Plus,
  Download,
  FileDown,
  Filter,
  ArrowDownUp,
  CircleCheck,
  CircleDashed,
  Trash2,
  X,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { exportCommittee, exportDelegateDocument } from "@/lib/file-io"
import type { Committee, Delegate } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

type SortKey = "delegation" | "name" | "speeches" | "amendments" | "pois"
type SortDir = "asc" | "desc"

const COUNTERS: {
  field: "speeches" | "pois"
  label: string
  icon: typeof Mic
}[] = [
  { field: "speeches", label: "Speech", icon: Mic },
  { field: "pois", label: "POI", icon: MessageCircleQuestion },
]

interface AmendmentCounts {
  approved: number
  entertaining: number
}

export function ParticipationTracker({
  committeeId,
}: {
  committeeId: string
}) {
  const { getCommittee, incrementCounter, removeDelegate } = useStore()
  const committee = getCommittee(committeeId)

  const [minSpeeches, setMinSpeeches] = useState(0)
  const [minAmendments, setMinAmendments] = useState(0)
  const [minPois, setMinPois] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>("delegation")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const delegates = committee?.delegates ?? []
  const amendments = committee?.amendments ?? []

  // Per-delegate approved/entertaining amendment counts, derived live from the
  // amendment workspace (F2) — this is what "syncs" amendments to the delegate.
  const counts = useMemo(() => {
    const map = new Map<string, AmendmentCounts>()
    for (const d of delegates) map.set(d.id, { approved: 0, entertaining: 0 })
    for (const a of amendments) {
      if (!a.submitterId) continue
      const entry = map.get(a.submitterId)
      if (!entry) continue
      if (a.status === "APPROVED") entry.approved += 1
      else if (a.status === "ENTERTAINING") entry.entertaining += 1
    }
    return map
  }, [delegates, amendments])

  const amdTotal = (id: string) => {
    const c = counts.get(id)
    return c ? c.approved + c.entertaining : 0
  }

  const visible = useMemo(() => {
    const filtered = delegates.filter(
      (d) =>
        d.speeches >= minSpeeches &&
        amdTotal(d.id) >= minAmendments &&
        d.pois >= minPois &&
        (search.trim() === "" ||
          (d.delegation ?? "").toLowerCase().includes(search.trim().toLowerCase()) ||
          d.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          d.school.toLowerCase().includes(search.trim().toLowerCase())),
    )
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === "delegation") cmp = (a.delegation ?? "").localeCompare(b.delegation ?? "")
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name)
      else if (sortKey === "amendments") cmp = amdTotal(a.id) - amdTotal(b.id)
      else cmp = a[sortKey] - b[sortKey]
      return sortDir === "asc" ? cmp : -cmp
    })
    return sorted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delegates, minSpeeches, minAmendments, minPois, sortKey, sortDir, search, counts])

  if (!committee) return null

  const filtersActive = minSpeeches > 0 || minAmendments > 0 || minPois > 0

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function downloadSelected(committee: Committee) {
    const chosen = delegates.filter((d) => selected.has(d.id))
    if (chosen.length === 0) return
    exportDelegateDocument(committee, chosen)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search delegation, name, or school…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          <div className="flex items-center gap-2">
            <ArrowDownUp className="size-4 text-muted-foreground" aria-hidden="true" />
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-[150px]" aria-label="Sort by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delegation">Delegation (A–Z)</SelectItem>
                <SelectItem value="name">Name (A–Z)</SelectItem>
                <SelectItem value="speeches">Speeches</SelectItem>
                <SelectItem value="amendments">Amendments</SelectItem>
                <SelectItem value="pois">POIs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
              <SelectTrigger className="w-[130px]" aria-label="Sort direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {selected.size > 0 ? (
              <Button variant="outline" onClick={() => downloadSelected(committee)}>
                <FileDown className="size-4" />
                Download report ({selected.size})
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => exportCommittee(committee, "csv", visible)}
            >
              <Download className="size-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportCommittee(committee, "xlsx", visible)}
            >
              <Download className="size-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 border-t border-border pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Filter className="size-4" aria-hidden="true" />
            Min. filters
          </span>
          <FilterField label="Speeches" value={minSpeeches} onChange={setMinSpeeches} />
          <FilterField label="Amendments" value={minAmendments} onChange={setMinAmendments} />
          <FilterField label="POIs" value={minPois} onChange={setMinPois} />
          {filtersActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMinSpeeches(0)
                setMinAmendments(0)
                setMinPois(0)
              }}
            >
              <X className="size-4" />
              Clear
            </Button>
          ) : null}
          <span className="ml-auto text-sm text-muted-foreground">
            Showing {visible.length} of {delegates.length}
          </span>
        </div>
      </Card>

      {/* Delegate rows */}
      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No delegates match the current filters.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((d) => (
            <DelegateRow
              key={d.id}
              delegate={d}
              counts={counts.get(d.id) ?? { approved: 0, entertaining: 0 }}
              selected={selected.has(d.id)}
              onToggleSelect={() => toggleSelect(d.id)}
              onDownload={() => exportDelegateDocument(committee, [d])}
              onIncrement={(field, delta) =>
                incrementCounter(committeeId, d.id, field, delta)
              }
              onRemove={() => {
                removeDelegate(committeeId, d.id)
                toast.success(`Removed ${d.delegation}.`)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-20"
      />
    </div>
  )
}

function DelegateRow({
  delegate,
  counts,
  selected,
  onToggleSelect,
  onDownload,
  onIncrement,
  onRemove,
}: {
  delegate: Delegate
  counts: AmendmentCounts
  selected: boolean
  onToggleSelect: () => void
  onDownload: () => void
  onIncrement: (field: "speeches" | "pois", delta: number) => void
  onRemove: () => void
}) {
  const total = delegate.speeches + counts.approved + counts.entertaining + delegate.pois
  return (
    <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select ${delegate.delegation} for download`}
          className="mt-1"
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {delegate.delegation || "—"}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {delegate.name}
            {delegate.school ? ` · ${delegate.school}` : ""}
            {delegate.email ? ` · ${delegate.email}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {COUNTERS.map(({ field, label, icon: Icon }) => (
          <div
            key={field}
            className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 p-1.5"
          >
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label={`Decrease ${label} for ${delegate.delegation}`}
              onClick={() => onIncrement(field, -1)}
              disabled={delegate[field] === 0}
            >
              <Minus className="size-3.5" />
            </Button>
            <div className="flex min-w-16 flex-col items-center px-1">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </span>
              <span className="font-serif text-lg font-semibold tabular-nums text-foreground">
                {delegate[field]}
              </span>
            </div>
            <Button
              size="icon"
              className="size-7"
              aria-label={`Add ${label} for ${delegate.delegation}`}
              onClick={() => onIncrement(field, 1)}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        ))}

        {/* Amendment stats are derived from the amendment workspace (read-only). */}
        <DerivedStat
          icon={CircleCheck}
          label="Approved"
          value={counts.approved}
          title="Approved amendments submitted (from the Amendments tab)"
        />
        <DerivedStat
          icon={CircleDashed}
          label="Entertaining"
          value={counts.entertaining}
          title="Entertaining amendments submitted (from the Amendments tab)"
        />

        <div className="flex flex-col items-center px-2">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="font-serif text-lg font-semibold tabular-nums text-primary">
            {total}
          </span>
        </div>

        <Button
          size="icon"
          variant="ghost"
          aria-label={`Download ${delegate.delegation} report`}
          title="Download this delegate's report"
          onClick={onDownload}
        >
          <FileDown className="size-4 text-muted-foreground" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Remove ${delegate.delegation}`}
          onClick={onRemove}
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>
    </Card>
  )
}

function DerivedStat({
  icon: Icon,
  label,
  value,
  title,
}: {
  icon: typeof Mic
  label: string
  value: number
  title: string
}) {
  return (
    <div
      className="flex min-w-16 flex-col items-center rounded-md border border-dashed border-border px-2 py-1.5"
      title={title}
    >
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
      <span className="font-serif text-lg font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  )
}
