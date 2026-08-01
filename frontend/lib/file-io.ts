import { read, utils, writeFile } from "xlsx"
import type { Committee, Delegate } from "@/lib/types"

export interface ParsedDelegate {
  delegation: string
  name: string
  school: string
  email: string
}

const DELEGATION_KEYS = ["delegation", "country", "nation", "assigned country", "represented country"]
const NAME_KEYS = ["name", "delegate", "delegate name", "fullname", "full name"]
const SCHOOL_KEYS = ["school", "institution", "organisation", "organization"]
const EMAIL_KEYS = ["email", "e-mail", "mail", "email address"]

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

const HEADER_KEYS = [...DELEGATION_KEYS, ...NAME_KEYS, ...SCHOOL_KEYS, ...EMAIL_KEYS]

/**
 * Find the row that actually contains the column headers. Some exports
 * (e.g. committee attendance sheets) have a title row above the real
 * header row, so we can't just assume row 0 is the header.
 */
function findHeaderRowIndex(rows: unknown[][]): number {
  const index = rows.findIndex((row) =>
    row.some((cell) => {
      const text = String(cell ?? "").trim().toLowerCase()
      return text !== "" && HEADER_KEYS.some((key) => text === key || text.includes(key))
    }),
  )
  return index === -1 ? 0 : index
}

/**
 * Parse a CSV or Excel file into delegate rows.
 * Reads the first worksheet, locates the header row (skipping any title
 * rows above it), and maps common header names.
 */
export async function parseDelegateFile(file: File): Promise<ParsedDelegate[]> {
  const buffer = await file.arrayBuffer()
  const workbook = read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  const rawRows = utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  })
  if (rawRows.length === 0) return []

  const headerRowIndex = findHeaderRowIndex(rawRows)
  const headers = rawRows[headerRowIndex].map((cell) => String(cell ?? "").trim())
  const dataRows = rawRows.slice(headerRowIndex + 1)

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
    if (!delegation && !name && !school && !email) continue
    parsed.push({ delegation, name: name || "Unnamed Delegate", school, email })
  }
  return parsed
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
