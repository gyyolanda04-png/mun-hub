export interface Delegate {
  id: string
  /** The country/delegation this delegate represents. Unique per committee. */
  delegation: string
  name: string
  school: string
  email: string
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
  openingCeremony: number // minutes
  closingCeremony: number // minutes
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

export interface Committee {
  id: string
  name: string
  topic: string
  createdAt: number
  delegates: Delegate[]
  debate: DebateState
  /** Ordered attendance columns, e.g. ["Day 1", "Day 2- Morning", "Day 2- Lunch"]. */
  attendanceSessions: string[]
  /** Usernames of the chairs who can see and edit this committee. */
  members: string[]
}

export const STAGE_LABELS: Record<DebateStage, string> = {
  opening: "Opening Ceremony",
  general: "General Debate",
  resolution: "Resolution Debate",
  amendment: "Amendment Debate",
  voting: "Voting Procedure",
  closing: "Closing Ceremony",
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
    openingCeremony: 15,
    closingCeremony: 15,
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
}

export function calculateTiming(debate: DebateState): TimingResult {
  const debateTime = Math.max(
    0,
    debate.totalDuration - debate.openingCeremony - debate.closingCeremony,
  )
  const resolutions = Math.max(1, debate.resolutions)
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
  }
}
