"use client"

import { useMemo, useState } from "react"
import {
  Mic,
  FileEdit,
  MessageCircleQuestion,
  Minus,
  Plus,
  Download,
  Filter,
  ArrowDownUp,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { exportCommittee } from "@/lib/file-io"
import type { Delegate } from "@/lib/types"
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type SortKey = "delegation" | "name" | "speeches" | "amendments" | "pois"
type SortDir = "asc" | "desc"

const COUNTERS: {
  field: "speeches" | "amendments" | "pois"
  label: string
  icon: typeof Mic
}[] = [
  { field: "speeches", label: "Speech", icon: Mic },
  { field: "amendments", label: "Amendment", icon: FileEdit },
  { field: "pois", label: "POI", icon: MessageCircleQuestion },
]

export function ParticipationTracker({
  committeeId,
}: {
  committeeId: string
}) {
  const { getCommittee, incrementCounter, removeDelegate, addDelegates } =
    useStore()
  const committee = getCommittee(committeeId)

  const [minSpeeches, setMinSpeeches] = useState(0)
  const [minAmendments, setMinAmendments] = useState(0)
  const [minPois, setMinPois] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>("delegation")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [search, setSearch] = useState("")

  const delegates = committee?.delegates ?? []

  const visible = useMemo(() => {
    const filtered = delegates.filter(
      (d) =>
        d.speeches >= minSpeeches &&
        d.amendments >= minAmendments &&
        d.pois >= minPois &&
        (search.trim() === "" ||
          d.delegation.toLowerCase().includes(search.trim().toLowerCase()) ||
          d.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          d.school.toLowerCase().includes(search.trim().toLowerCase())),
    )
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === "delegation") cmp = a.delegation.localeCompare(b.delegation)
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name)
      else cmp = a[sortKey] - b[sortKey]
      return sortDir === "asc" ? cmp : -cmp
    })
    return sorted
  }, [delegates, minSpeeches, minAmendments, minPois, sortKey, sortDir, search])

  if (!committee) return null

  const filtersActive = minSpeeches > 0 || minAmendments > 0 || minPois > 0

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
            <AddDelegateDialog
              onAdd={(d) => {
                addDelegates(committeeId, [d])
                toast.success(`Added ${d.delegation}.`)
              }}
            />
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
  onIncrement,
  onRemove,
}: {
  delegate: Delegate
  onIncrement: (field: "speeches" | "amendments" | "pois", delta: number) => void
  onRemove: () => void
}) {
  const total = delegate.speeches + delegate.amendments + delegate.pois
  return (
    <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {delegate.delegation || "—"}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {delegate.name}
          {delegate.school ? ` · ${delegate.school}` : ""}
          {delegate.email ? ` · ${delegate.email}` : ""}
        </p>
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

        <div className="flex flex-col items-center px-2">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="font-serif text-lg font-semibold tabular-nums text-primary">
            {total}
          </span>
        </div>

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

function AddDelegateDialog({
  onAdd,
}: {
  onAdd: (d: { delegation: string; name: string; school: string; email: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [delegation, setDelegation] = useState("")
  const [name, setName] = useState("")
  const [school, setSchool] = useState("")
  const [email, setEmail] = useState("")

  function submit() {
    if (!delegation.trim()) {
      toast.error("Delegation (country) is required.")
      return
    }
    onAdd({
      delegation: delegation.trim(),
      name: name.trim(),
      school: school.trim(),
      email: email.trim(),
    })
    setDelegation("")
    setName("")
    setSchool("")
    setEmail("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <UserPlus className="size-4" />
            Add
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a delegate</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="d-delegation">Delegation (country)</Label>
            <Input
              id="d-delegation"
              value={delegation}
              onChange={(e) => setDelegation(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="d-name">Name</Label>
            <Input id="d-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="d-school">School</Label>
            <Input id="d-school" value={school} onChange={(e) => setSchool(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="d-email">Email</Label>
            <Input id="d-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add delegate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
