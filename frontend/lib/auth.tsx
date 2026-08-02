"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import * as api from "@/lib/api"
import { ApiError } from "@/lib/api"
import { clearToken, getToken, onTokenChange, setToken } from "@/lib/auth-token"

interface AuthValue {
  username: string | null
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    function syncFromToken() {
      const token = getToken()
      if (!token) {
        if (!cancelled) {
          setUsername(null)
          setReady(true)
        }
        return
      }
      api
        .me()
        .then((res) => {
          if (!cancelled) setUsername(res.username)
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            // token already cleared by the api layer
          }
          if (!cancelled) setUsername(null)
        })
        .finally(() => {
          if (!cancelled) setReady(true)
        })
    }

    syncFromToken()
    const unsubscribe = onTokenChange(() => {
      if (!getToken()) {
        setUsername(null)
      }
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const value: AuthValue = {
    username,
    ready,
    async login(usernameInput, password) {
      const res = await api.login(usernameInput, password)
      setToken(res.token)
      setUsername(res.username)
    },
    async register(usernameInput, password) {
      const res = await api.register(usernameInput, password)
      setToken(res.token)
      setUsername(res.username)
    },
    logout() {
      api.logout().catch(() => {
        // best-effort; clear local state regardless
      })
      clearToken()
      setUsername(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
