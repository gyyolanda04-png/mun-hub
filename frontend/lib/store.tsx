"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import {
  type Committee,
  type Delegate,
  type DebateState,
} from "@/lib/types"
import * as api from "@/lib/api"

interface StoreValue {
  committees: Committee[]
  ready: boolean
  createCommittee: (name: string, topic: string) => Promise<Committee>
  deleteCommittee: (id: string) => void
  getCommittee: (id: string) => Committee | undefined
  addDelegates: (
    committeeId: string,
    delegates: Omit<Delegate, "id" | "speeches" | "amendments" | "pois">[],
  ) => void
  removeDelegate: (committeeId: string, delegateId: string) => void
  incrementCounter: (
    committeeId: string,
    delegateId: string,
    field: "speeches" | "amendments" | "pois",
    delta: number,
  ) => void
  updateDebate: (committeeId: string, patch: Partial<DebateState>) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [ready, setReady] = useState(false)
  // Mirrors `committees` synchronously so rollbacks always restore the
  // state from right before an optimistic update, even across renders.
  const committeesRef = useRef<Committee[]>([])
  committeesRef.current = committees

  useEffect(() => {
    let cancelled = false
    api
      .listCommittees()
      .then((data) => {
        if (!cancelled) setCommittees(data)
      })
      .catch((err) => {
        console.log("[mun-hub] failed to load committees", err)
        toast.error("Couldn't reach the server. Is the backend running?")
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function replaceCommittee(updated: Committee) {
    setCommittees((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const value: StoreValue = {
    committees,
    ready,
    async createCommittee(name, topic) {
      const committee = await api.createCommittee(name.trim(), topic.trim())
      setCommittees((prev) => [committee, ...prev])
      return committee
    },
    deleteCommittee(id) {
      const previous = committeesRef.current
      setCommittees((prev) => prev.filter((c) => c.id !== id))
      api.deleteCommittee(id).catch((err) => {
        console.log("[mun-hub] failed to delete committee", err)
        toast.error("Failed to delete the committee on the server.")
        setCommittees(previous)
      })
    },
    getCommittee(id) {
      return committees.find((c) => c.id === id)
    },
    addDelegates(committeeId, delegates) {
      api
        .addDelegates(committeeId, delegates)
        .then(replaceCommittee)
        .catch((err) => {
          console.log("[mun-hub] failed to add delegates", err)
          toast.error("Failed to add delegate(s) on the server.")
        })
    },
    removeDelegate(committeeId, delegateId) {
      const previous = committeesRef.current
      setCommittees((prev) =>
        prev.map((c) =>
          c.id === committeeId
            ? {
                ...c,
                delegates: c.delegates.filter((d) => d.id !== delegateId),
                debate: {
                  ...c.debate,
                  currentSpeakerId:
                    c.debate.currentSpeakerId === delegateId
                      ? null
                      : c.debate.currentSpeakerId,
                  speakerQueue: c.debate.speakerQueue.filter(
                    (id) => id !== delegateId,
                  ),
                },
              }
            : c,
        ),
      )
      api.removeDelegate(committeeId, delegateId).catch((err) => {
        console.log("[mun-hub] failed to remove delegate", err)
        toast.error("Failed to remove the delegate on the server.")
        setCommittees(previous)
      })
    },
    incrementCounter(committeeId, delegateId, field, delta) {
      const previous = committeesRef.current
      setCommittees((prev) =>
        prev.map((c) =>
          c.id === committeeId
            ? {
                ...c,
                delegates: c.delegates.map((d) =>
                  d.id === delegateId
                    ? { ...d, [field]: Math.max(0, d[field] + delta) }
                    : d,
                ),
              }
            : c,
        ),
      )
      api.incrementCounter(committeeId, delegateId, field, delta).catch((err) => {
        console.log("[mun-hub] failed to update counter", err)
        toast.error("Failed to sync that update with the server.")
        setCommittees(previous)
      })
    },
    updateDebate(committeeId, patch) {
      const previous = committeesRef.current
      setCommittees((prev) =>
        prev.map((c) =>
          c.id === committeeId
            ? { ...c, debate: { ...c.debate, ...patch } }
            : c,
        ),
      )
      api.updateDebate(committeeId, patch).catch((err) => {
        console.log("[mun-hub] failed to update debate state", err)
        toast.error("Failed to sync debate state with the server.")
        setCommittees(previous)
      })
    },
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
