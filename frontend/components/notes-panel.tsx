"use client"

import { useState } from "react"
import { Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import type { Note } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

function formatStamp(ts: number): string {
  const d = new Date(ts)
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const isToday = new Date().toDateString() === d.toDateString()
  return isToday
    ? time
    : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`
}

/**
 * Notes / event-tracker (F5). A running, timestamped log of what happens in
 * committee — lives in the workspace (not shown in Presentation Mode).
 */
export function NotesPanel({ committeeId }: { committeeId: string }) {
  const { getCommittee, createNote } = useStore()
  const committee = getCommittee(committeeId)
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")
  const [busy, setBusy] = useState(false)

  if (!committee) return null

  const notes = [...committee.notes].sort((a, b) => b.createdAt - a.createdAt)
  const q = search.trim().toLowerCase()
  const filtered = q ? notes.filter((n) => n.text.toLowerCase().includes(q)) : notes

  async function add() {
    const text = draft.trim()
    if (!text) return
    setBusy(true)
    try {
      await createNote(committeeId, text)
      setDraft("")
    } catch (err) {
      console.log("[mun-hub] failed to add note", err)
      toast.error("Failed to add that note.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void add()
            }
          }}
          placeholder="Log an event… e.g. China proposed an amendment on Article 4  (Enter to add, Shift+Enter for a new line)"
          className="min-h-[70px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex justify-end">
          <Button onClick={() => void add()} disabled={busy || !draft.trim()}>
            <Plus className="size-4" />
            Add note
          </Button>
        </div>
      </Card>

      {notes.length > 0 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      ) : null}

      {notes.length === 0 ? (
        <Card className="border-dashed py-14 text-center text-sm text-muted-foreground">
          No notes yet. Jot down what happens as the committee runs.
        </Card>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No notes match your search.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((n) => (
            <NoteItem key={n.id} committeeId={committeeId} note={n} />
          ))}
        </div>
      )}
    </div>
  )
}

function NoteItem({ committeeId, note }: { committeeId: string; note: Note }) {
  const { updateNote, removeNote } = useStore()
  const [text, setText] = useState(note.text)
  const [editing, setEditing] = useState(false)

  function save() {
    setEditing(false)
    if (text !== note.text) {
      updateNote(committeeId, note.id, text)
    }
  }

  return (
    <Card className="flex items-start gap-3 p-3">
      <span
        className="mt-0.5 shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
        title={new Date(note.createdAt).toLocaleString()}
      >
        {formatStamp(note.createdAt)}
      </span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={save}
            className="min-h-[140px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <p
            onClick={() => setEditing(true)}
            className="cursor-text whitespace-pre-wrap text-sm text-foreground"
          >
            {note.text || <span className="italic text-muted-foreground">Empty note — click to edit</span>}
          </p>
        )}
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Delete note"
        onClick={() => removeNote(committeeId, note.id)}
      >
        <Trash2 className="size-4 text-muted-foreground" />
      </Button>
    </Card>
  )
}
