'use client'

import { useEffect, useState } from 'react'
import {
  DEBUG_EVENT_NAME,
  type DebugChannel,
  type DebugEventDetail,
  isDebugEnv,
} from '@/lib/meta-events'

/*
  Development-only tracking inspector (Phase 4).

  Shows every funnel event as it fires: the event name, its unique event id, and
  whether it was seen browser-side, server-side, or BOTH — the last being the
  proof that Pixel/CAPI dedup is wired correctly, since a deduped conversion
  shares one id across both channels.

  It renders nothing unless NODE_ENV is development. `isDebugEnv` is evaluated at
  build time, so in a production bundle this component's body is dead code behind
  a false constant and never mounts. Kept out of app/layout on purpose — it is
  mounted only by the estimator page, the one surface it is meant to observe.
*/

type Row = { name: string; eventId?: string; channels: Set<DebugChannel>; at: number }

export function EventDebugger() {
  const [rows, setRows] = useState<Row[]>([])
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!isDebugEnv) return
    function onEvent(e: Event) {
      const detail = (e as CustomEvent<DebugEventDetail>).detail
      if (!detail) return
      setRows((prev) => {
        /* Merge by event id so a browser+server pair collapses into one row showing BOTH. */
        const idx = detail.eventId
          ? prev.findIndex((r) => r.eventId === detail.eventId && r.name === detail.name)
          : -1
        if (idx >= 0) {
          const next = [...prev]
          const merged = { ...next[idx], channels: new Set(next[idx].channels) }
          merged.channels.add(detail.channel)
          next[idx] = merged
          return next
        }
        return [
          { name: detail.name, eventId: detail.eventId, channels: new Set([detail.channel]), at: detail.at },
          ...prev,
        ].slice(0, 20)
      })
    }
    window.addEventListener(DEBUG_EVENT_NAME, onEvent)
    return () => window.removeEventListener(DEBUG_EVENT_NAME, onEvent)
  }, [])

  if (!isDebugEnv) return null

  return (
    <div className="fixed bottom-3 right-3 z-[9999] w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border border-border bg-card/95 font-mono text-xs shadow-xl backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-border bg-muted/40 px-3 py-2 text-left font-semibold text-foreground"
      >
        <span>Event debugger · dev only</span>
        <span className="text-muted-foreground">{open ? 'hide' : `show (${rows.length})`}</span>
      </button>
      {open && (
        <div className="max-h-[40vh] overflow-y-auto">
          {rows.length === 0 ? (
            <p className="px-3 py-3 text-muted-foreground">No events yet. Interact with the estimator.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r, i) => {
                const channel = r.channels.has('browser') && r.channels.has('server')
                  ? 'both'
                  : r.channels.has('browser')
                    ? 'browser'
                    : 'server'
                return (
                  <li key={`${r.eventId ?? r.name}-${i}`} className="flex flex-col gap-1 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{r.name}</span>
                      <span
                        className={
                          channel === 'both'
                            ? 'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground bg-primary'
                            : 'rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground'
                        }
                      >
                        {channel}
                      </span>
                    </div>
                    {r.eventId && <span className="truncate text-muted-foreground">{r.eventId}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
