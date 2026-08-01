import type { Committee, DebateState, Delegate } from "@/lib/types"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "")

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
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

export function addDelegates(
  committeeId: string,
  delegates: Omit<Delegate, "id" | "speeches" | "amendments" | "pois">[],
): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/delegates`, {
    method: "POST",
    body: JSON.stringify({ delegates }),
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
