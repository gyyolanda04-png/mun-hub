"use client"

import { useRef, useState } from "react"
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { parseDelegateFile } from "@/lib/file-io"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function DelegateImport({
  committeeId,
  onImported,
}: {
  committeeId: string
  /** Called after a file is successfully parsed and sent to be added. */
  onImported?: () => void
}) {
  const { addDelegates } = useStore()
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    const validExt = /\.(csv|xlsx|xls)$/i.test(file.name)
    if (!validExt) {
      toast.error("Please upload a CSV or Excel (.csv, .xlsx) file.")
      return
    }
    setBusy(true)
    try {
      const { delegates, attendanceSessions } = await parseDelegateFile(file)
      if (delegates.length === 0) {
        toast.error("No delegates found. Check that the file has data rows.")
        return
      }
      addDelegates(committeeId, delegates, attendanceSessions)
      const sessionNote =
        attendanceSessions.length > 0
          ? ` with ${attendanceSessions.length} attendance session${attendanceSessions.length === 1 ? "" : "s"}`
          : ""
      toast.success(
        `Imported ${delegates.length} delegate${delegates.length === 1 ? "" : "s"}${sessionNote}.`,
      )
      onImported?.()
    } catch (err) {
      console.log("[v0] import error", err)
      toast.error("Could not read that file. Please try another export.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        void handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-6 py-10 text-center transition-colors",
        dragging && "border-primary bg-primary/5",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-card text-primary shadow-sm">
        {busy ? (
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
        ) : (
          <UploadCloud className="size-6" aria-hidden="true" />
        )}
      </div>
      <div>
        <p className="font-medium text-foreground">
          Drag &amp; drop a CSV or Excel file
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll read delegate info and any attendance columns (e.g.
          &quot;Day 1&quot;, &quot;Day 2- Morning&quot;) automatically.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        <FileSpreadsheet className="size-4" />
        Choose file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <p className="text-xs text-muted-foreground/80">
        Recognised columns: delegation (country) / name / school / email / attendance (e.g. Day 1)
      </p>
    </div>
  )
}
