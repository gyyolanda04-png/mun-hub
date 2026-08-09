"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import type { Delegate } from "@/lib/types"
import { Input } from "@/components/ui/input"

/**
 * A dropdown that is also a search box: shows the selected delegate's
 * delegation name (not its id), and lets you type to filter a long roster.
 */
export function DelegateCombobox({
  delegates,
  value,
  onChange,
  placeholder = "Choose delegate",
  className,
}: {
  delegates: Delegate[]
  value: string | null
  onChange: (id: string | null) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selected = delegates.find((d) => d.id === value) ?? null
  const q = query.trim().toLowerCase()
  const filtered = q
    ? delegates.filter(
        (d) =>
          d.delegation.toLowerCase().includes(q) || d.name.toLowerCase().includes(q),
      )
    : delegates

  function close() {
    setOpen(false)
    setQuery("")
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm"
      >
        <span className={selected ? "truncate" : "truncate text-muted-foreground"}>
          {selected ? selected.delegation : placeholder}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={close}
          />
          <div className="absolute z-50 mt-1 w-full min-w-[220px] rounded-md border border-border bg-card shadow-md">
            <div className="p-2">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search delegate…"
                className="h-8 text-sm"
              />
            </div>
            <div className="max-h-56 overflow-auto pb-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No matches.</p>
              ) : (
                filtered.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onChange(d.id)
                      close()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary"
                  >
                    <Check
                      className={`size-4 shrink-0 ${value === d.id ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="truncate">{d.delegation}</span>
                    {d.name ? (
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {d.name}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
