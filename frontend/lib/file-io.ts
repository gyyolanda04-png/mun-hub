import { read, utils, writeFile } from "xlsx"
import type { Committee, Delegate } from "@/lib/types"
import { AMENDMENT_TYPE_LABELS, AMENDMENT_STATUS_LABELS } from "@/lib/types"

/** Per-delegate amendment stats derived from the amendment workspace. */
export function amendmentStatsFor(committee: Committee, delegateId: string) {
  const submitted = committee.amendments.filter((a) => a.submitterId === delegateId)
  return {
    approved: submitted.filter((a) => a.status === "APPROVED").length,
    entertaining: submitted.filter((a) => a.status === "ENTERTAINING").length,
    submitted,
  }
}

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
  const data = list.map((d) => {
    const s = amendmentStatsFor(committee, d.id)
    return {
      Delegation: d.delegation,
      "Delegate Name": d.name,
      School: d.school,
      Email: d.email,
      Bloc: d.bloc,
      "Total Speeches": d.speeches,
      "Approved Amendments": s.approved,
      "Entertaining Amendments": s.entertaining,
      "Total POIs": d.pois,
      "Total Participation": d.speeches + s.approved + s.entertaining + d.pois,
    }
  })

  const worksheet = utils.json_to_sheet(data)
  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet, "Participation")

  const safeName = committee.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
  const filename = `${safeName || "committee"}-stats.${format}`
  writeFile(workbook, filename, {
    bookType: format === "csv" ? "csv" : "xlsx",
  })
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/**
 * Download a readable report document for one or more delegates: their
 * participation stats plus every amendment they submitted (with status).
 * Opens as a printable HTML file (Save as PDF from the browser).
 */
export function exportDelegateDocument(committee: Committee, delegates: Delegate[]) {
  const sections = delegates
    .map((d) => {
      const s = amendmentStatsFor(committee, d.id)
      const total = d.speeches + s.approved + s.entertaining + d.pois
      const attendance = committee.attendanceSessions
        .map((sess) => `${esc(sess)}: ${d.attendance[sess] ? "Present" : "Absent"}`)
        .join(" &middot; ")
      const amendments =
        s.submitted.length === 0
          ? "<p><em>No amendments submitted.</em></p>"
          : s.submitted
              .map(
                (a) => `
        <div class="amendment">
          <div class="amendment-head">
            <strong>${esc(AMENDMENT_TYPE_LABELS[a.type])}${a.clauseRef ? " " + esc(a.clauseRef) : ""}</strong>
            <span class="status">${esc(AMENDMENT_STATUS_LABELS[a.status])}</span>
            ${a.friendly ? "<span class='friendly'>Friendly</span>" : ""}
            ${a.parentId ? "<span class='friendly'>2nd degree</span>" : ""}
          </div>
          <div>${esc(a.text)}</div>
        </div>`,
              )
              .join("")
      return `
      <section>
        <h2>${esc(d.delegation || "—")}</h2>
        <p class="sub">${esc(d.name)}${d.school ? " &middot; " + esc(d.school) : ""}${
          d.bloc ? " &middot; Bloc: " + esc(d.bloc) : ""
        }${d.email ? " &middot; " + esc(d.email) : ""}</p>
        <table class="stats">
          <tr><th>Speeches</th><th>Approved amendments</th><th>Entertaining amendments</th><th>POIs</th><th>Total</th></tr>
          <tr><td>${d.speeches}</td><td>${s.approved}</td><td>${s.entertaining}</td><td>${d.pois}</td><td>${total}</td></tr>
        </table>
        ${attendance ? `<p class="att"><strong>Attendance:</strong> ${attendance}</p>` : ""}
        <h3>Amendments submitted (${s.submitted.length})</h3>
        ${amendments}
      </section>`
    })
    .join("<hr/>")

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(
    committee.name,
  )} — Delegate report</title><style>
    body{font-family:Georgia,'Times New Roman',serif;max-width:820px;margin:40px auto;padding:0 24px;color:#1a1a1a;line-height:1.5}
    h1{font-size:22px;margin-bottom:24px}
    h2{font-size:20px;margin-bottom:2px}
    h3{font-size:15px;margin-top:18px;margin-bottom:6px}
    .sub{color:#555;margin-top:0}
    table.stats{border-collapse:collapse;margin:10px 0}
    table.stats th,table.stats td{border:1px solid #ccc;padding:6px 14px;text-align:center;font-size:13px}
    table.stats th{background:#f4f4f4}
    .amendment{border:1px solid #e2e2e2;border-radius:6px;padding:10px 12px;margin:8px 0}
    .amendment-head{margin-bottom:4px}
    .status{font-size:11px;text-transform:uppercase;letter-spacing:.04em;padding:1px 7px;border-radius:10px;background:#eee;margin-left:6px}
    .friendly{font-size:11px;color:#555;margin-left:6px}
    .att{font-size:13px;color:#444}
    hr{border:none;border-top:2px solid #111;margin:32px 0}
    @media print{body{margin:0}}
  </style></head><body>
    <h1>${esc(committee.name)} — Delegate report</h1>
    ${sections}
  </body></html>`

  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  const base =
    delegates.length === 1
      ? delegates[0].delegation || delegates[0].name || "delegate"
      : `${committee.name || "committee"}-delegates`
  link.download = `${base.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
