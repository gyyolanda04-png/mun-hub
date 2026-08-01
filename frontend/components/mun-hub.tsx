"use client"

import { useState } from "react"
import { Gavel } from "lucide-react"
import { useStore } from "@/lib/store"
import { CommitteeList } from "@/components/committee-list"
import { CommitteeWorkspace } from "@/components/committee-workspace"
import { PresentationMode } from "@/components/presentation-mode"

export function MunHub() {
  const { ready } = useStore()
  const [openCommitteeId, setOpenCommitteeId] = useState<string | null>(null)
  const [presenting, setPresenting] = useState(false)

  if (presenting && openCommitteeId) {
    return (
      <PresentationMode
        committeeId={openCommitteeId}
        onExit={() => setPresenting(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Gavel className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-semibold text-foreground">
              MUN Hub
            </span>
            <span className="text-xs text-muted-foreground">
              Committee Management &amp; Debate Assistant
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {!ready ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            Loading committees…
          </p>
        ) : openCommitteeId ? (
          <CommitteeWorkspace
            committeeId={openCommitteeId}
            onBack={() => setOpenCommitteeId(null)}
            onPresent={() => setPresenting(true)}
          />
        ) : (
          <CommitteeList onOpen={setOpenCommitteeId} />
        )}
      </main>
    </div>
  )
}
