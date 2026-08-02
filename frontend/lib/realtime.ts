import { Client } from "@stomp/stompjs"
import { API_BASE } from "@/lib/api"
import { getToken } from "@/lib/auth-token"
import type { Committee } from "@/lib/types"

const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws"

export interface CommitteeWsEvent {
  type: "updated" | "deleted"
  committee: Committee | null
  committeeId: string
}

/**
 * Subscribes to live updates for one committee. Call the returned function
 * to unsubscribe (e.g. on unmount or when the user navigates away).
 */
export function subscribeToCommittee(
  committeeId: string,
  onEvent: (event: CommitteeWsEvent) => void,
): () => void {
  const token = getToken()
  if (!token) return () => {}

  const client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe(`/topic/committees/${committeeId}`, (message) => {
        try {
          const event = JSON.parse(message.body) as CommitteeWsEvent
          onEvent(event)
        } catch (err) {
          console.log("[mun-hub] failed to parse realtime message", err)
        }
      })
    },
    onStompError: (frame) => {
      console.log("[mun-hub] STOMP error", frame.headers.message)
    },
  })
  client.activate()

  return () => {
    client.deactivate()
  }
}
