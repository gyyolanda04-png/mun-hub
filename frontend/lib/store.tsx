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
import { ApiError } from "@/lib/api"

interface StoreValue {
  committees: Committee[]
  ready: boolean
  createCommittee: (name: string) => Promise<Committee>
  deleteCommittee: (id: string) => void
  getCommittee: (id: string) => Committee | undefined
  addDelegates: (
    committeeId: string,
    delegates: (Omit<Delegate, "id" | "speeches" | "amendments" | "pois" | "attendance"> & {
      attendance?: Record<string, boolean>
    })[],
    attendanceSessions?: string[],
  ) => void
  removeDelegate: (committeeId: string, delegateId: string) => void
  incrementCounter: (
    committeeId: string,
    delegateId: string,
    field: "speeches" | "amendments" | "pois",
    delta: number,
  ) => void
  updateDebate: (committeeId: string, patch: Partial<DebateState>) => void
  setAttendance: (
    committeeId: string,
    delegateId: string,
    session: string,
    present: boolean,
  ) => void
  addAttendanceSession: (committeeId: string, session: string) => void
  removeAttendanceSession: (committeeId: string, session: string) => void
  addMember: (committeeId: string, username: string) => Promise<Committee>
  removeMember: (committeeId: string, username: string) => Promise<Committee>
  /** Applies a live update pushed over the WebSocket from another chair's action. */
  applyRemoteUpdate: (committee: Committee) => void
  /** Removes a committee that was deleted by another chair, live. */
  applyRemoteDelete: (committeeId: string) => void
  /** Re-fetch one committee from the server (polling safety net for live sync). */
  refreshCommittee: (committeeId: string) => Promise<void>
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
        if (err instanceof ApiError && err.status === 401) {
          toast.error("Your session isn't valid anymore. Please log in again.")
        } else if (err instanceof ApiError && err.status === 0) {
          // Network-level / cold-start failure — message already explains it.
          toast.error(err.message)
        } else if (err instanceof ApiError) {
          toast.error(`Couldn't load committees (${err.status}). ${err.message}`)
        } else {
          toast.error("Couldn't reach the server. Is the backend running?")
        }
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
    async createCommittee(name) {
      const committee = await api.createCommittee(name.trim())
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
    addDelegates(committeeId, delegates, attendanceSessions) {
      const withAttendance = delegates.map((d) => ({ ...d, attendance: d.attendance ?? {} }))
      api
        .addDelegates(committeeId, withAttendance, attendanceSessions)
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
    setAttendance(committeeId, delegateId, session, present) {
      const previous = committeesRef.current
      setCommittees((prev) =>
        prev.map((c) =>
          c.id === committeeId
            ? {
                ...c,
                delegates: c.delegates.map((d) =>
                  d.id === delegateId
                    ? { ...d, attendance: { ...d.attendance, [session]: present } }
                    : d,
                ),
              }
            : c,
        ),
      )
      api.setAttendance(committeeId, delegateId, session, present).catch((err) => {
        console.log("[mun-hub] failed to update attendance", err)
        toast.error("Failed to sync attendance with the server.")
        setCommittees(previous)
      })
    },
    addAttendanceSession(committeeId, session) {
      api
        .addAttendanceSession(committeeId, session)
        .then(replaceCommittee)
        .catch((err) => {
          console.log("[mun-hub] failed to add attendance session", err)
          toast.error("Failed to add that session on the server.")
        })
    },
    removeAttendanceSession(committeeId, session) {
      const previous = committeesRef.current
      setCommittees((prev) =>
        prev.map((c) =>
          c.id === committeeId
            ? {
                ...c,
                attendanceSessions: c.attendanceSessions.filter((s) => s !== session),
                delegates: c.delegates.map((d) => {
                  const { [session]: _removed, ...rest } = d.attendance
                  return { ...d, attendance: rest }
                }),
              }
            : c,
        ),
      )
      api.removeAttendanceSession(committeeId, session).catch((err) => {
        console.log("[mun-hub] failed to remove attendance session", err)
        toast.error("Failed to remove that session on the server.")
        setCommittees(previous)
      })
    },
    async addMember(committeeId, username) {
      const committee = await api.addMember(committeeId, username)
      replaceCommittee(committee)
      return committee
    },
    async removeMember(committeeId, username) {
      const committee = await api.removeMember(committeeId, username)
      replaceCommittee(committee)
      return committee
    },
    applyRemoteUpdate(committee) {
      replaceCommittee(committee)
    },
    applyRemoteDelete(committeeId) {
      setCommittees((prev) => prev.filter((c) => c.id !== committeeId))
    },
    async refreshCommittee(committeeId) {
      try {
        const fresh = await api.getCommittee(committeeId)
        replaceCommittee(fresh)
      } catch (err) {
        // Best-effort background sync; ignore transient failures.
        console.log("[mun-hub] committee refresh failed", err)
      }
    },
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
