"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Manually add a single delegate to a committee. Lives on the Attendance
 * page (delegates are the roster that attendance/participation build on).
 */
export function AddDelegateDialog({ committeeId }: { committeeId: string }) {
  const { addDelegates } = useStore()
  const [open, setOpen] = useState(false)
  const [delegation, setDelegation] = useState("")
  const [name, setName] = useState("")
  const [school, setSchool] = useState("")
  const [email, setEmail] = useState("")
  const [bloc, setBloc] = useState("")

  function submit() {
    if (!delegation.trim()) {
      toast.error("Delegation (country) is required.")
      return
    }
    addDelegates(committeeId, [
      {
        delegation: delegation.trim(),
        name: name.trim(),
        school: school.trim(),
        email: email.trim(),
        bloc: bloc.trim(),
      },
    ])
    toast.success(`Added ${delegation.trim()}.`)
    setDelegation("")
    setName("")
    setSchool("")
    setEmail("")
    setBloc("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <UserPlus className="size-4" />
            Add delegate
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="d-bloc">Bloc</Label>
            <Input
              id="d-bloc"
              placeholder="e.g. Western Bloc"
              value={bloc}
              onChange={(e) => setBloc(e.target.value)}
            />
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
