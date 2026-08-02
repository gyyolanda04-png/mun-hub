const STORAGE_KEY = "mun-hub:token"

let token: string | null = null
let hydrated = false
const listeners = new Set<() => void>()

function hydrate() {
  if (hydrated) return
  hydrated = true
  if (typeof window === "undefined") return
  token = window.localStorage.getItem(STORAGE_KEY)
}

export function getToken(): string | null {
  hydrate()
  return token
}

export function setToken(next: string) {
  hydrate()
  token = next
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next)
  }
  listeners.forEach((fn) => fn())
}

export function clearToken() {
  hydrate()
  token = null
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY)
  }
  listeners.forEach((fn) => fn())
}

/** Notified whenever the token changes (login, logout, or a 401 clearing it). */
export function onTokenChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
