import { read, utils, writeFile } from "xlsx"
import type { Committee, Delegate } from "@/lib/types"

export interface ParsedDelegate {
  name: string
  school: string
  email: string
}

const NAME_KEYS = ["name", "delegate", "delegate name", "fullname", "full name"]
const SCHOOL_KEYS = ["school", "institution", "delegation", "country", "organisation", "organization"]
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

/**
 * Parse a CSV or Excel file into delegate rows.
 * Reads the first worksheet and maps common header names.
 */
export async function parseDelegateFile(file: File): Promise<ParsedDelegate[]> {
  const buffer = await file.arrayBuffer()
  const workbook = read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  })

  const parsed: ParsedDelegate[] = []
  for (const row of rows) {
    const name = pick(row, NAME_KEYS)
    const school = pick(row, SCHOOL_KEYS)
    const email = pick(row, EMAIL_KEYS)
    if (!name && !school && !email) continue
    parsed.push({ name: name || "Unnamed Delegate", school, email })
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
