"use client"

import { useEffect, useState } from "react"
import { Gavel, LogOut } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { StoreProvider, useStore } from "@/lib/store"
import { subscribeToCommittee } from "@/lib/realtime"
import { AuthScreen } from "@/components/auth-screen"
import { Button } from "@/components/ui/button"
import { CommitteeList } from "@/components/committee-list"
import { CommitteeWorkspace } from "@/components/committee-workspace"
import { PresentationMode } from "@/components/presentation-mode"

export function MunHub() {
  const { username, ready: authReady } = useAuth()

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!username) {
    return <AuthScreen />
  }

  return (
    <StoreProvider>
      <AuthenticatedApp username={username} />
    </StoreProvider>
  )
}

function AuthenticatedApp({ username }: { username: string }) {
  const { ready, applyRemoteUpdate, applyRemoteDelete, refreshCommittee } = useStore()
  const { logout } = useAuth()
  const [openCommitteeId, setOpenCommitteeId] = useState<string | null>(null)
  const [presenting, setPresenting] = useState(false)

  // Safety net for live sync: while a committee is open, re-fetch it on an
  // interval so chairs stay in sync even if the WebSocket push doesn't arrive
  // (e.g. a dropped connection on free-tier hosting). The WebSocket above is
  // still what makes updates feel instant; this just guarantees eventual sync.
  useEffect(() => {
    if (!openCommitteeId) return
    const id = setInterval(() => {
      void refreshCommittee(openCommitteeId)
    }, 5000)
    return () => clearInterval(id)
  }, [openCommitteeId, refreshCommittee])

  // Live sync: while a committee is open (workspace or presentation mode),
  // subscribe to its topic so another chair's changes show up instantly.
  useEffect(() => {
    if (!openCommitteeId) return
    const unsubscribe = subscribeToCommittee(openCommitteeId, (event) => {
      if (event.type === "updated" && event.committee) {
        applyRemoteUpdate(event.committee)
      } else if (event.type === "deleted") {
        applyRemoteDelete(event.committeeId)
        toast.info("This committee was deleted by another chair.")
        setOpenCommitteeId(null)
        setPresenting(false)
      }
    })
    return unsubscribe
  }, [openCommitteeId, applyRemoteUpdate, applyRemoteDelete])

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

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{username}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="size-4" />
              Log out
            </Button>
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
