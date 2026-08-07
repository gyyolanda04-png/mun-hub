"use client"

import { useState } from "react"
import {
  Plus,
  Trash2,
  Monitor,
  MonitorX,
  CornerDownRight,
} from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import {
  type Amendment,
  type AmendmentStatus,
  type AmendmentType,
  type Delegate,
  AMENDMENT_STATUSES,
  AMENDMENT_STATUS_LABELS,
  AMENDMENT_TYPE_LABELS,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

const STATUS_BADGE: Record<AmendmentStatus, string> = {
  PENDING: "bg-secondary text-secondary-foreground",
  ENTERTAINING: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  APPROVED: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  PASSED: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  FAILED: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
}

export function AmendmentsPanel({ committeeId }: { committeeId: string }) {
  const { getCommittee } = useStore()
  const committee = getCommittee(committeeId)
  if (!committee) return null

  const { amendments, delegates, presentedAmendmentId } = committee
  const topLevel = amendments.filter((a) => !a.parentId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {amendments.length} amendment{amendments.length === 1 ? "" : "s"}
          {presentedAmendmentId ? " · 1 on screen" : ""}
        </p>
        <CreateAmendmentDialog committeeId={committeeId} delegates={delegates} />
      </div>

      {topLevel.length === 0 ? (
        <Card className="border-dashed py-14 text-center text-sm text-muted-foreground">
          No amendments yet. Create one to start tracking the debate.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {topLevel.map((a) => (
            <AmendmentCard
              key={a.id}
              committeeId={committeeId}
              amendment={a}
              delegates={delegates}
              presentedId={presentedAmendmentId}
              children2={amendments.filter((c) => c.parentId === a.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AmendmentCard({
  committeeId,
  amendment,
  delegates,
  presentedId,
  children2,
  isChild = false,
}: {
  committeeId: string
  amendment: Amendment
  delegates: Delegate[]
  presentedId: string | null
  children2?: Amendment[]
  isChild?: boolean
}) {
  const { updateAmendment, removeAmendment, presentAmendment } = useStore()
  const [text, setText] = useState(amendment.text)
  const [clauseRef, setClauseRef] = useState(amendment.clauseRef)
  const isPresented = presentedId === amendment.id

  return (
    <Card
      className={`flex flex-col gap-3 p-4 ${isChild ? "border-l-2 border-l-primary/40" : ""} ${
        isPresented ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {isChild ? (
          <CornerDownRight className="size-4 text-muted-foreground" aria-hidden="true" />
        ) : null}
        <span className="font-medium text-foreground">
          {amendment.submitter || "Unassigned"}
        </span>
        {amendment.friendly ? (
          <Badge variant="secondary" className="text-[10px]">
            Friendly
          </Badge>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {AMENDMENT_TYPE_LABELS[amendment.type]}
          {amendment.clauseRef ? ` ${amendment.clauseRef}` : ""}
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[amendment.status]}`}
        >
          {AMENDMENT_STATUS_LABELS[amendment.status]}
        </span>
      </div>

      {/* Editable fields (auto-save on change / blur) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Submitter</Label>
          <Select
            value={amendment.submitterId ?? ""}
            onValueChange={(v) =>
              updateAmendment(committeeId, amendment.id, { submitterId: v || null })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Choose delegate" />
            </SelectTrigger>
            <SelectContent>
              {delegates.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.delegation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={amendment.type}
            onValueChange={(v) =>
              updateAmendment(committeeId, amendment.id, { type: (v ?? "ADD") as AmendmentType })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["ADD", "MODIFY", "STRIKE"] as AmendmentType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {AMENDMENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Clause</Label>
          <Input
            className="h-8 text-xs"
            placeholder="e.g. 1. e."
            value={clauseRef}
            onChange={(e) => setClauseRef(e.target.value)}
            onBlur={() => {
              if (clauseRef !== amendment.clauseRef) {
                updateAmendment(committeeId, amendment.id, { clauseRef })
              }
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Amendment content</Label>
        <textarea
          className="min-h-[70px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            if (text !== amendment.text) {
              updateAmendment(committeeId, amendment.id, { text })
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={amendment.friendly}
            onChange={(e) =>
              updateAmendment(committeeId, amendment.id, { friendly: e.target.checked })
            }
          />
          Friendly
        </label>

        <Select
          value={amendment.status}
          onValueChange={(v) =>
            updateAmendment(committeeId, amendment.id, {
              status: (v ?? "PENDING") as AmendmentStatus,
            })
          }
        >
          <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Amendment status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AMENDMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {AMENDMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {isPresented ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => presentAmendment(committeeId, null)}
            >
              <MonitorX className="size-4" />
              Remove from screen
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => presentAmendment(committeeId, amendment.id)}
            >
              <Monitor className="size-4" />
              Upload to presentation
            </Button>
          )}
          {!isChild ? (
            <CreateAmendmentDialog
              committeeId={committeeId}
              delegates={delegates}
              parentId={amendment.id}
              trigger={
                <Button variant="outline" size="sm">
                  <CornerDownRight className="size-4" />
                  Amend
                </Button>
              }
            />
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete amendment"
            onClick={() => removeAmendment(committeeId, amendment.id)}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {children2 && children2.length > 0 ? (
        <div className="mt-1 flex flex-col gap-3">
          {children2.map((c) => (
            <AmendmentCard
              key={c.id}
              committeeId={committeeId}
              amendment={c}
              delegates={delegates}
              presentedId={presentedId}
              isChild
            />
          ))}
        </div>
      ) : null}
    </Card>
  )
}

function CreateAmendmentDialog({
  committeeId,
  delegates,
  parentId,
  trigger,
}: {
  committeeId: string
  delegates: Delegate[]
  parentId?: string
  trigger?: React.ReactElement
}) {
  const { createAmendment } = useStore()
  const [open, setOpen] = useState(false)
  const [submitterId, setSubmitterId] = useState<string>("")
  const [type, setType] = useState<AmendmentType>("ADD")
  const [clauseRef, setClauseRef] = useState("")
  const [text, setText] = useState("")
  const [friendly, setFriendly] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!text.trim()) {
      toast.error("Enter the amendment content.")
      return
    }
    setBusy(true)
    try {
      await createAmendment(committeeId, {
        submitterId: submitterId || null,
        type,
        clauseRef: clauseRef.trim(),
        text: text.trim(),
        friendly,
        parentId: parentId ?? null,
      })
      setSubmitterId("")
      setType("ADD")
      setClauseRef("")
      setText("")
      setFriendly(false)
      setOpen(false)
      toast.success(parentId ? "Second-degree amendment added." : "Amendment added.")
    } catch (err) {
      console.log("[mun-hub] failed to create amendment", err)
      toast.error("Failed to create the amendment.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="size-4" />
              New amendment
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{parentId ? "Amend an amendment" : "New amendment"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>Submitted by</Label>
            <Select value={submitterId} onValueChange={(v) => setSubmitterId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Choose delegate" />
              </SelectTrigger>
              <SelectContent>
                {delegates.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.delegation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType((v ?? "ADD") as AmendmentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["ADD", "MODIFY", "STRIKE"] as AmendmentType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {AMENDMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="a-clause">Clause</Label>
              <Input
                id="a-clause"
                placeholder="e.g. 1. e."
                value={clauseRef}
                onChange={(e) => setClauseRef(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="a-text">Amendment content</Label>
            <textarea
              id="a-text"
              className="min-h-[90px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={friendly}
              onChange={(e) => setFriendly(e.target.checked)}
            />
            Friendly amendment
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {parentId ? "Add amendment" : "Create amendment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
