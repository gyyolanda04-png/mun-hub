"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  type Committee,
  type Delegate,
  type DebateState,
  createDefaultDebate,
} from "@/lib/types"

const STORAGE_KEY = "mun-hub:committees:v1"

interface StoreValue {
  committees: Committee[]
  ready: boolean
  createCommittee: (name: string, topic: string) => Committee
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

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [ready, setReady] = useState(false)
  const loaded = useRef(false)

  // Load once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Committee[]
        setCommittees(Array.isArray(parsed) ? parsed : [])
      }
    } catch (err) {
      console.log("[v0] failed to load committees", err)
    } finally {
      loaded.current = true
      setReady(true)
    }
  }, [])

  // Persist on change (after initial load)
  useEffect(() => {
    if (!loaded.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(committees))
    } catch (err) {
      console.log("[v0] failed to persist committees", err)
    }
  }, [committees])

  const value: StoreValue = {
    committees,
    ready,
    createCommittee(name, topic) {
      const committee: Committee = {
        id: uid(),
        name: name.trim(),
        topic: topic.trim(),
        createdAt: Date.now(),
        delegates: [],
        debate: createDefaultDebate(),
      }
      setCommittees((prev) => [committee, ...prev])
      return committee
    },
    deleteCommittee(id) {
      setCommittees((prev) => prev.filter((c) => c.id !== id))
    },
    getCommittee(id) {
      return committees.find((c) => c.id === id)
    },
    addDelegates(committeeId, delegates) {
      setCommittees((prev) =>
        prev.map((c) => {
          if (c.id !== committeeId) return c
          const additions: Delegate[] = delegates.map((d) => ({
            id: uid(),
            name: d.name,
            school: d.school,
            email: d.email,
            speeches: 0,
            amendments: 0,
            pois: 0,
          }))
          return { ...c, delegates: [...c.delegates, ...additions] }
        }),
      )
    },
    removeDelegate(committeeId, delegateId) {
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
    },
    incrementCounter(committeeId, delegateId, field, delta) {
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
    },
    updateDebate(committeeId, patch) {
      setCommittees((prev) =>
        prev.map((c) =>
          c.id === committeeId
            ? { ...c, debate: { ...c.debate, ...patch } }
            : c,
        ),
      )
    },
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
