"use client"

import { useState } from "react"
import { Plus, Users, Trash2, ArrowRight, CalendarDays } from "lucide-react"
import { useStore } from "@/lib/store"
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
import { toast } from "sonner"

export function CommitteeList({ onOpen }: { onOpen: (id: string) => void }) {
  const { committees, createCommittee, deleteCommittee } = useStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Please enter a committee name.")
      return
    }
    try {
      const committee = await createCommittee(name)
      setName("")
      setOpen(false)
      toast.success(`Committee "${committee.name}" created.`)
      onOpen(committee.id)
    } catch (err) {
      console.log("[mun-hub] failed to create committee", err)
      toast.error("Failed to create the committee on the server.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-balance text-foreground">
            Your Committees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a committee, import delegates, and track debate participation.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="size-4" />
                New Committee
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a committee</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="committee-name">Committee name</Label>
                <Input
                  id="committee-name"
                  placeholder="e.g. UN Security Council"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreate()
                  }}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create committee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {committees.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Users className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-foreground">No committees yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first committee to get started.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {committees.map((c) => (
            <Card
              key={c.id}
              className="group flex flex-col gap-4 p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex flex-col gap-1">
                <h2 className="font-serif text-lg font-semibold leading-snug text-pretty text-foreground">
                  {c.name}
                </h2>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" aria-hidden="true" />
                  {c.delegates.length} delegate
                  {c.delegates.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-auto flex items-center justify-between">
                <Button size="sm" onClick={() => onOpen(c.id)}>
                  Open
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete committee ${c.name}`}
                  onClick={() => {
                    deleteCommittee(c.id)
                    toast.success(`Deleted "${c.name}".`)
                  }}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
