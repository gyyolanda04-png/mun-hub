import { read, utils, writeFile } from "xlsx"
import type { Committee, Delegate } from "@/lib/types"

export interface ParsedDelegate {
  delegation: string
  name: string
  school: string
  email: string
  bloc: string
  attendance: Record<string, boolean>
}

export interface ParsedDelegateFile {
  delegates: ParsedDelegate[]
  /** Attendance columns found in the sheet, e.g. ["Day 1", "Day 2- Morning"]. */
  attendanceSessions: string[]
}

const DELEGATION_KEYS = ["delegation", "country", "nation", "assigned country", "represented country"]
const NAME_KEYS = ["name", "delegate", "delegate name", "fullname", "full name"]
const SCHOOL_KEYS = ["school", "institution", "organisation", "organization"]
const EMAIL_KEYS = ["email", "e-mail", "mail", "email address"]
const BLOC_KEYS = ["bloc", "block", "voting bloc", "group", "alliance", "coalition"]
const KNOWN_KEYS = [...DELEGATION_KEYS, ...NAME_KEYS, ...SCHOOL_KEYS, ...EMAIL_KEYS, ...BLOC_KEYS]

// Matches column headers like "Day 1", "Day 2- Morning", "Session 3", "Afternoon".
const ATTENDANCE_HEADER_PATTERN = /\bday\s*\d|\bsession\s*\d|morning|afternoon|evening|\blunch\b/i
const PRESENT_VALUES = new Set(["true", "1", "y", "yes", "x", "present"])

function pick(row: Record<string, unknown>, keys: string[]): string {
  const entries = Object.entries(row)
  for (const wanted of keys) {
    const match = entries.find(
      ([k]) => k.trim().toLowerCase() === wanted,
    )
    if (match && match[1] != null) return String(match[1]).trim()
  }
  // fuzzy contains match
  for (const wanted of keys) {
    const match = entries.find(([k]) =>
      k.trim().toLowerCase().includes(wanted),
    )
    if (match && match[1] != null) return String(match[1]).trim()
  }
  return ""
}

/**
 * Find the row that actually contains the column headers. Some exports
 * (e.g. committee attendance sheets) have a title row above the real
 * header row, so we can't just assume row 0 is the header.
 */
function findHeaderRowIndex(rows: unknown[][]): number {
  const index = rows.findIndex((row) =>
    row.some((cell) => {
      const text = String(cell ?? "").trim().toLowerCase()
      return text !== "" && KNOWN_KEYS.some((key) => text === key || text.includes(key))
    }),
  )
  return index === -1 ? 0 : index
}

function isKnownHeader(header: string): boolean {
  const text = header.trim().toLowerCase()
  return text !== "" && KNOWN_KEYS.some((key) => text === key || text.includes(key))
}

function isAttendanceHeader(header: string): boolean {
  return header.trim() !== "" && !isKnownHeader(header) && ATTENDANCE_HEADER_PATTERN.test(header)
}

function parsePresent(value: unknown): boolean {
  return PRESENT_VALUES.has(String(value ?? "").trim().toLowerCase())
}

/**
 * Parse a CSV or Excel file into delegate rows.
 * Reads the first worksheet, locates the header row (skipping any title
 * rows above it), and maps common header names.
 */
export async function parseDelegateFile(file: File): Promise<ParsedDelegateFile> {
  const buffer = await file.arrayBuffer()
  const workbook = read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { delegates: [], attendanceSessions: [] }
  const sheet = workbook.Sheets[sheetName]
  const rawRows = utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  })
  if (rawRows.length === 0) return { delegates: [], attendanceSessions: [] }

  const headerRowIndex = findHeaderRowIndex(rawRows)
  const headers = rawRows[headerRowIndex].map((cell) => String(cell ?? "").trim())
  const dataRows = rawRows.slice(headerRowIndex + 1)
  const attendanceSessions = [...new Set(headers.filter(isAttendanceHeader))]

  const parsed: ParsedDelegate[] = []
  for (const dataRow of dataRows) {
    const isRowBlank = dataRow.every((cell) => String(cell ?? "").trim() === "")
    if (isRowBlank) {
      // A blank row after the roster has started usually marks the end of
      // the delegate table (totals/notes/legend sections often follow).
      if (parsed.length > 0) break
      continue
    }

    const row: Record<string, unknown> = {}
    headers.forEach((header, i) => {
      if (header) row[header] = dataRow[i] ?? ""
    })

    const delegation = pick(row, DELEGATION_KEYS)
    const name = pick(row, NAME_KEYS)
    const school = pick(row, SCHOOL_KEYS)
    const email = pick(row, EMAIL_KEYS).replace(/^mailto:/i, "").trim()
    const bloc = pick(row, BLOC_KEYS)
    if (!delegation && !name && !school && !email) continue

    const attendance: Record<string, boolean> = {}
    for (const session of attendanceSessions) {
      attendance[session] = parsePresent(row[session])
    }
    parsed.push({ delegation, name: name || "Unnamed Delegate", school, email, bloc, attendance })
  }
  return { delegates: parsed, attendanceSessions }
}

type ExportFormat = "csv" | "xlsx"

/**
 * Export delegate participation statistics to CSV or Excel.
 */
export function exportCommittee(
  committee: Committee,
  format: ExportFormat,
  delegates?: Delegate[],
) {
  const list = delegates ?? committee.delegates
  const data = list.map((d) => ({
    Delegation: d.delegation,
    "Delegate Name": d.name,
    School: d.school,
    Email: d.email,
    Bloc: d.bloc,
    "Total Speeches": d.speeches,
    "Total Amendments": d.amendments,
    "Total POIs": d.pois,
    "Total Participation": d.speeches + d.amendments + d.pois,
  }))

  const worksheet = utils.json_to_sheet(data)
  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet, "Participation")

  const safeName = committee.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
  const filename = `${safeName || "committee"}-stats.${format}`
  writeFile(workbook, filename, {
    bookType: format === "csv" ? "csv" : "xlsx",
  })
}
