"use client"

import { ArrowLeft, Monitor, Users, Timer, ListChecks } from "lucide-react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DelegateImport } from "@/components/delegate-import"
import { ParticipationTracker } from "@/components/participation-tracker"
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
            {committee.topic ? (
              <p className="text-sm text-muted-foreground">{committee.topic}</p>
            ) : null}
            <div className="mt-1">
              <Badge variant="secondary">
                {committee.delegates.length} delegate
                {committee.delegates.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>

          <Button onClick={onPresent}>
            <Monitor className="size-4" />
            Presentation Mode
          </Button>
        </div>
      </div>

      <Tabs defaultValue="participation" className="w-full">
        <TabsList>
          <TabsTrigger value="participation">
            <ListChecks className="size-4" />
            Participation
          </TabsTrigger>
          <TabsTrigger value="delegates">
            <Users className="size-4" />
            Delegates
          </TabsTrigger>
          <TabsTrigger value="timing">
            <Timer className="size-4" />
            Debate Timing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participation" className="mt-6">
          {committee.delegates.length === 0 ? (
            <EmptyDelegates committeeId={committeeId} />
          ) : (
            <ParticipationTracker committeeId={committeeId} />
          )}
        </TabsContent>

        <TabsContent value="delegates" className="mt-6">
          <div className="flex flex-col gap-4">
            <DelegateImport committeeId={committeeId} />
          </div>
        </TabsContent>

        <TabsContent value="timing" className="mt-6">
          <TimingCalculator committeeId={committeeId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyDelegates({ committeeId }: { committeeId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-medium text-foreground">Import delegates to begin</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV or Excel file below. Once delegates are imported,
          you&apos;ll be able to track speeches, amendments, and POIs here.
        </p>
      </div>
      <DelegateImport committeeId={committeeId} />
    </div>
  )
}
