"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Monitor,
  CalendarCheck,
  Timer,
  ListChecks,
  FileEdit,
  NotebookPen,
  ChartColumn,
  UploadCloud,
  Users,
  UserPlus,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { useStore } from "@/lib/store"
import { ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DelegateImport } from "@/components/delegate-import"
import { AttendanceTracker } from "@/components/attendance-tracker"
import { ParticipationTracker } from "@/components/participation-tracker"
import { AmendmentsPanel } from "@/components/amendments-panel"
import { NotesPanel } from "@/components/notes-panel"
import { BlocAnalytics } from "@/components/bloc-analytics"
import { TimingCalculator } from "@/components/timing-calculator"

export function CommitteeWorkspace({
  committeeId,
  onBack,
  onPresent,
}: {
  committeeId: string
  onBack: () => void
  onPresent: () => void
}) {
  const { getCommittee } = useStore()
  const committee = getCommittee(committeeId)

  if (!committee) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          This committee no longer exists.
        </p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to committees
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All committees
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-2xl font-semibold text-balance text-foreground">
              {committee.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">
                {committee.delegates.length} delegate
                {committee.delegates.length === 1 ? "" : "s"}
              </Badge>
              <Badge variant="secondary">
                {committee.members.length} chair
                {committee.members.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ManageChairsDialog committeeId={committeeId} members={committee.members} />
            <Button onClick={onPresent}>
              <Monitor className="size-4" />
              Presentation Mode
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList>
          <TabsTrigger value="attendance">
            <CalendarCheck className="size-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="participation">
            <ListChecks className="size-4" />
            Participation
          </TabsTrigger>
          <TabsTrigger value="amendments">
            <FileEdit className="size-4" />
            Amendments
          </TabsTrigger>
          <TabsTrigger value="notes">
            <NotebookPen className="size-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="blocs">
            <ChartColumn className="size-4" />
            Blocs
          </TabsTrigger>
          <TabsTrigger value="timing">
            <Timer className="size-4" />
            Debate Timing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <div className="flex flex-col gap-4">
            {committee.delegates.length === 0 ? (
              <>
                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="font-medium text-foreground">
                    Import delegates to begin
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a CSV or Excel file below. Any attendance columns
                    (e.g. &quot;Day 1&quot;, &quot;Day 2- Morning&quot;) are
                    picked up automatically.
                  </p>
                </div>
                <DelegateImport committeeId={committeeId} />
              </>
            ) : null}
            <AttendanceTracker
              committeeId={committeeId}
              uploadSlot={<ImportDelegatesDialog committeeId={committeeId} />}
            />
          </div>
        </TabsContent>

        <TabsContent value="participation" className="mt-6">
          {committee.delegates.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Import delegates on the Attendance tab to start tracking
              participation.
            </p>
          ) : (
            <ParticipationTracker committeeId={committeeId} />
          )}
        </TabsContent>

        <TabsContent value="amendments" className="mt-6">
          <AmendmentsPanel committeeId={committeeId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesPanel committeeId={committeeId} />
        </TabsContent>

        <TabsContent value="blocs" className="mt-6">
          <BlocAnalytics committeeId={committeeId} />
        </TabsContent>

        <TabsContent value="timing" className="mt-6">
          <TimingCalculator committeeId={committeeId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ManageChairsDialog({
  committeeId,
  members,
}: {
  committeeId: string
  members: string[]
}) {
  const { addMember, removeMember } = useStore()
  const { username: currentUsername } = useAuth()
  const [open, setOpen] = useState(false)
  const [usernameInput, setUsernameInput] = useState("")
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    const trimmed = usernameInput.trim()
    if (!trimmed) {
      toast.error("Enter a username.")
      return
    }
    setBusy(true)
    try {
      await addMember(committeeId, trimmed)
      toast.success(`Added ${trimmed} as a chair.`)
      setUsernameInput("")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add that chair.")
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(username: string) {
    setBusy(true)
    try {
      await removeMember(committeeId, username)
      toast.success(`Removed ${username}.`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove that chair.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Users className="size-4" />
            Manage chairs
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chairs on this committee</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {members.map((username) => (
              <div
                key={username}
                className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2"
              >
                <span className="text-sm text-foreground">
                  {username}
                  {username === currentUsername ? (
                    <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                  ) : null}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${username}`}
                  disabled={busy || members.length <= 1}
                  onClick={() => void handleRemove(username)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Username to add"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAdd()
              }}
              disabled={busy}
            />
            <Button onClick={() => void handleAdd()} disabled={busy}>
              <UserPlus className="size-4" />
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ImportDelegatesDialog({ committeeId }: { committeeId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <UploadCloud className="size-4" />
            Upload another file
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import delegates</DialogTitle>
        </DialogHeader>
        <DelegateImport committeeId={committeeId} onImported={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
