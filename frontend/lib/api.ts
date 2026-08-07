import type {
  Amendment,
  AmendmentStatus,
  AmendmentType,
  Committee,
  DebateState,
  Delegate,
} from "@/lib/types"
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

// Free hosting (Render) spins the backend down after ~15 min idle; the first
// request then either fails to connect or returns 502/503/504 for up to a
// minute while it wakes back up. Retry those transparently so a cold start
// looks like "a bit slow" instead of "broken".
const COLD_START_RETRIES = 5

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const url = `${API_BASE}${path}`
  const options: RequestInit = {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  }

  let res: Response | undefined
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(url, options)
    } catch {
      // Network-level failure: server unreachable or still cold-starting.
      if (attempt < COLD_START_RETRIES) {
        await sleep(2500 * (attempt + 1))
        continue
      }
      throw new ApiError(
        0,
        "Couldn't reach the server. It may be waking up — wait a moment and try again.",
      )
    }
    // Platform gateway errors while the app boots: keep waiting it out.
    if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < COLD_START_RETRIES) {
      await sleep(2500 * (attempt + 1))
      continue
    }
    break
  }

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

export function getCommittee(id: string): Promise<Committee> {
  return request<Committee>(`/api/committees/${id}`)
}

export function createCommittee(name: string): Promise<Committee> {
  return request<Committee>("/api/committees", {
    method: "POST",
    body: JSON.stringify({ name }),
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

export interface CreateAmendmentInput {
  submitterId: string | null
  type: AmendmentType
  clauseRef: string
  text: string
  friendly: boolean
  parentId: string | null
}

export function createAmendment(committeeId: string, input: CreateAmendmentInput): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/amendments`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateAmendment(
  committeeId: string,
  amendmentId: string,
  patch: Partial<{
    submitterId: string | null
    type: AmendmentType
    clauseRef: string
    text: string
    friendly: boolean
    status: AmendmentStatus
  }>,
): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/amendments/${amendmentId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
}

export function deleteAmendment(committeeId: string, amendmentId: string): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/amendments/${amendmentId}`, {
    method: "DELETE",
  })
}

export function presentAmendment(
  committeeId: string,
  amendmentId: string | null,
): Promise<Committee> {
  return request<Committee>(`/api/committees/${committeeId}/present-amendment`, {
    method: "POST",
    body: JSON.stringify({ amendmentId }),
  })
}

/** Re-export so consumers can reference the Amendment type from the api module. */
export type { Amendment }
