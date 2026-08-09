export interface Delegate {
  id: string
  /** The country/delegation this delegate represents. Unique per committee. */
  delegation: string
  name: string
  school: string
  email: string
  /** Voting/negotiation bloc this delegate belongs to (officer-configurable). */
  bloc: string
  speeches: number
  amendments: number
  pois: number
  /** Session name (e.g. "Day 1", "Day 2- Morning") -> was this delegate present. */
  attendance: Record<string, boolean>
}

export interface DebateState {
  // Timing inputs
  totalDuration: number // minutes
  resolutions: number
  openingSpeech: number // minutes, per resolution
  closingSpeech: number // minutes, per resolution
  amendmentsPerResolution: number
  // Live presentation state
  stage: DebateStage
  currentResolution: number // 1-indexed
  currentAmendment: number // 1-indexed
  currentSpeakerId: string | null
  speakerQueue: string[] // delegate ids
}

export type DebateStage =
  | "opening"
  | "general"
  | "resolution"
  | "amendment"
  | "voting"
  | "closing"

export type AmendmentType = "ADD" | "STRIKE" | "MODIFY"
export type AmendmentStatus =
  | "PENDING"
  | "APPROVED"
  | "ENTERTAINING"
  | "PASSED"
  | "FAILED"

export interface Amendment {
  id: string
  /** Delegate id of the submitter (null if unset). */
  submitterId: string | null
  /** Denormalized delegation name of the submitter, for display. */
  submitter: string
  type: AmendmentType
  /** Clause being amended, e.g. "1. e." or "clause 6". */
  clauseRef: string
  text: string
  friendly: boolean
  status: AmendmentStatus
  /** Set when this amends another amendment (second-degree). */
  parentId: string | null
  createdAt: number
}

export const AMENDMENT_STATUSES: AmendmentStatus[] = [
  "PENDING",
  "ENTERTAINING",
  "APPROVED",
  "PASSED",
  "FAILED",
]

export const AMENDMENT_STATUS_LABELS: Record<AmendmentStatus, string> = {
  PENDING: "Pending",
  ENTERTAINING: "Entertaining",
  APPROVED: "Approved",
  PASSED: "Passed",
  FAILED: "Failed",
}

export const AMENDMENT_TYPE_LABELS: Record<AmendmentType, string> = {
  ADD: "Add",
  STRIKE: "Strike",
  MODIFY: "Modify",
}

export interface Committee {
  id: string
  name: string
  createdAt: number
  delegates: Delegate[]
  debate: DebateState
  /** Ordered attendance columns, e.g. ["Day 1", "Day 2- Morning", "Day 2- Lunch"]. */
  attendanceSessions: string[]
  /** Usernames of the chairs who can see and edit this committee. */
  members: string[]
  amendments: Amendment[]
  /** Amendment currently shown in Presentation Mode (null = none). */
  presentedAmendmentId: string | null
  notes: Note[]
}

export interface Note {
  id: string
  text: string
  createdAt: number
  updatedAt: number
}

export const STAGE_LABELS: Record<DebateStage, string> = {
  opening: "Opening Speech",
  general: "General Debate",
  resolution: "Resolution Debate",
  amendment: "Amendment Debate",
  voting: "Voting Procedure",
  closing: "Closing Speech",
}

export const STAGE_ORDER: DebateStage[] = [
  "opening",
  "general",
  "resolution",
  "amendment",
  "voting",
  "closing",
]

export function createDefaultDebate(): DebateState {
  return {
    totalDuration: 180,
    resolutions: 2,
    openingSpeech: 5,
    closingSpeech: 5,
    amendmentsPerResolution: 3,
    stage: "opening",
    currentResolution: 1,
    currentAmendment: 1,
    currentSpeakerId: null,
    speakerQueue: [],
  }
}

export interface TimingResult {
  debateTime: number
  timePerResolution: number
  amendmentDebateTime: number
  timePerAmendment: number
  /** Total minutes reserved for opening + closing speeches across all resolutions. */
  totalSpeechTime: number
}

export function calculateTiming(debate: DebateState): TimingResult {
  const resolutions = Math.max(1, debate.resolutions)
  // Each resolution gets its own opening speech and closing speech.
  const speechTimePerResolution = debate.openingSpeech + debate.closingSpeech
  const totalSpeechTime = speechTimePerResolution * resolutions
  const debateTime = Math.max(0, debate.totalDuration - totalSpeechTime)
  const timePerResolution = debateTime / resolutions
  // Reserve ~40% of each resolution's time for amendment debate
  const amendmentDebateTime = timePerResolution * 0.4
  const amendmentsPerResolution = Math.max(1, debate.amendmentsPerResolution)
  const timePerAmendment = amendmentDebateTime / amendmentsPerResolution
  return {
    debateTime,
    timePerResolution,
    amendmentDebateTime,
    timePerAmendment,
    totalSpeechTime,
  }
}
