import type { Committee, DebateState, Delegate } from "@/lib/types"
import { clearToken, getToken } from "@/lib/auth-token"

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "")

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      // response had no JSON body
    }
    if (res.status === 401) {
      clearToken()
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export interface AuthResponse {
  token: string
  username: string
}

export function register(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

export function login(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

export function logout(): Promise<void> {
  return request<void>("/api/auth/logout", { method: "POST" })
}

export function me(): Promise<{ username: string }> {
  return request<{ username: string }>("/api/auth/me")
}

export function listCommittees(): Promise<Committee[]> {
  return request<Committee[]>("/api/committees")
}

export function createCommittee(name: string, topic: string): Promise<Committee> {
  return request<Committee>("/api/committees", {
    method: "POST",
    body: JSON.stringify({ name, topic }),
  })
}

export function deleteCommittee(id: string): Promise<void> {
  return request<void>(`/api/committees/${id}`, { method: "DELETE" })
}

export function addMember(committeeId: string, username: string): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/members`, {
    method: "POST",
    body: JSON.stringify({ username }),
  })
}

export function removeMember(committeeId: string, username: string): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/members/${encodeURIComponent(username)}`, {
    method: "DELETE",
  })
}

export function addDelegates(
  committeeId: string,
  delegates: Omit<Delegate, "id" | "speeches" | "amendments" | "pois">[],
  attendanceSessions?: string[],
): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/delegates`, {
    method: "POST",
    body: JSON.stringify({ delegates, attendanceSessions: attendanceSessions ?? [] }),
  })
}

export function removeDelegate(committeeId: string, delegateId: string): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/delegates/${delegateId}`, {
    method: "DELETE",
  })
}

export function incrementCounter(
  committeeId: string,
  delegateId: string,
  field: "speeches" | "amendments" | "pois",
  delta: number,
): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/delegates/${delegateId}/counter`, {
    method: "PATCH",
    body: JSON.stringify({ field, delta }),
  })
}

export function updateDebate(
  committeeId: string,
  patch: Partial<DebateState>,
): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/debate`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
}

export function setAttendance(
  committeeId: string,
  delegateId: string,
  session: string,
  present: boolean,
): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/delegates/${delegateId}/attendance`, {
    method: "PATCH",
    body: JSON.stringify({ session, present }),
  })
}

export function addAttendanceSession(committeeId: string, session: string): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/attendance-sessions`, {
    method: "POST",
    body: JSON.stringify({ session }),
  })
}

export function removeAttendanceSession(committeeId: string, session: string): Promise<Committee> {
  return request<Committee>(
    `/api/committees/${committeeId}/attendance-sessions/${encodeURIComponent(session)}`,
    { method: "DELETE" },
  )
}
