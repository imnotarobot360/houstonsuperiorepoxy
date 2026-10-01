'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Images, RefreshCw, Trash2, Upload } from 'lucide-react'
import { generateFloorVisualization } from '@/app/actions/floor-visualization'
import type { FlakeBlend } from '@/lib/content/flake-blends'
import { checkPhoto, PHOTO_ACCEPT } from '@/lib/visualizer/validation'

/*
  "Preview on my garage photo" — the alternative to the stylized preview.

  IT IS AN ALTERNATIVE, NOT A REPLACEMENT. The pre-rendered garage is the
  default and stays one tap away, because it is the thing that always works:
  it needs no upload, no provider, no network round trip, and it shows the
  blend on a floor shot under controlled light. This path trades that
  reliability for the one thing it cannot offer — the visitor's own garage.

  EVERY RESULT IS LABELLED. An AI edit of a photograph of someone's home is the
  single most believable image on this site, which is exactly why it carries a
  caption saying what it is and what it cannot promise. The label is part of the
  figure, not a tooltip, and it is not dismissible.

  WHAT HAPPENS TO THE PHOTO: the original is sent to the server, used, and not
  stored. Only a generated result is archived, to private storage, so the office
  can see what the customer was shown. Nothing about the image is logged.
*/

/*
  There is no 'ready' state between picking a file and generating. Choosing a
  photo starts the work immediately — an intermediate "now press Generate" step
  is a second tap for no decision, and the visitor has already made the only
  choice that matters by selecting the photo.
*/
type Phase =
  | { kind: 'empty' }
  | { kind: 'working'; file: File; previewUrl: string }
  | { kind: 'done'; file: File; previewUrl: string; resultUrl: string; blendSlug: string }
  | { kind: 'failed'; file: File; previewUrl: string; message: string; retryable: boolean }

/* Failures an operator must fix are not worth offering a retry button for. */
const TERMINAL = new Set(['not_configured', 'auth'])

export function PhotoVisualizer({
  blend,
  onVisualization,
}: {
  blend: FlakeBlend
  /* Lets the designer carry the archived pathname into the lead. */
  onVisualization: (state: { pathname: string | null; attempted: boolean }) => void
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'empty' })
  const [inputError, setInputError] = useState<string | null>(null)
  const [compare, setCompare] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const objectUrl = useRef<string | null>(null)

  /* Object URLs are revoked on replace and on unmount: a phone photo held open
     is megabytes of memory on the device least able to spare it. */
  const setPreviewUrl = useCallback((url: string | null) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = url
  }, [])
  useEffect(() => () => setPreviewUrl(null), [setPreviewUrl])

  const run = useCallback(
    async (file: File, previewUrl: string) => {
      setPhase({ kind: 'working', file, previewUrl })
      setCompare(false)

      const fd = new FormData()
      fd.set('photo', file)
      fd.set('blendSlug', blend.slug)

      const response = await generateFloorVisualization(fd)

      if (response.ok) {
        setPhase({ kind: 'done', file, previewUrl, resultUrl: response.dataUrl, blendSlug: response.blendSlug })
        onVisualization({ pathname: response.pathname, attempted: true })
      } else {
        setPhase({
          kind: 'failed',
          file,
          previewUrl,
          message: response.message,
          retryable: !TERMINAL.has(response.code),
        })
        /* The lead still records that they tried — see buildDesignerLeadFields. */
        onVisualization({ pathname: null, attempted: true })
      }
    },
    [blend.slug, onVisualization],
  )

  const accept = useCallback(
    (file: File | undefined) => {
      setInputError(null)
      if (!file) return

      const check = checkPhoto(file)
      if (!check.ok) {
        setInputError(check.reason.message)
        return
      }

      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      void run(file, url)
    },
    [run, setPreviewUrl],
  )

  const remove = useCallback(() => {
    setPreviewUrl(null)
    setPhase({ kind: 'empty' })
    setInputError(null)
    setCompare(false)
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
    onVisualization({ pathname: null, attempted: false })
  }, [onVisualization, setPreviewUrl])

  /*
    Changing blend while a result is on screen makes that result stale — it is
    a picture of a different colour. Rather than quietly leaving it there, the
    result is regenerated from the photo we already have.
  */
  useEffect(() => {
    if (phase.kind === 'done' && phase.blendSlug !== blend.slug) {
      void run(phase.file, phase.previewUrl)
    }
  }, [blend.slug, phase, run])

  const busy = phase.kind === 'working'

  return (
    <section aria-labelledby="viz-heading" className="flex flex-col gap-4">
      <h3 id="viz-heading" className="sr-only">
        Preview this blend on a photo of your garage
      </h3>

      {/* ------------------------------------------------------------ frame */}
      <figure className="m-0 overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="relative aspect-[4/3] w-full bg-muted/30">
          {phase.kind === 'empty' ? (
            <EmptyState />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={phase.kind === 'done' && !compare ? phase.resultUrl : phase.previewUrl}
                alt={
                  phase.kind === 'done' && !compare
                    ? `AI visualization of your garage with the ${blend.name} flake blend on the floor`
                    : 'The garage photo you uploaded'
                }
                className="h-full w-full object-cover"
              />
              {busy && (
                <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <RefreshCw size={22} className="animate-spin text-primary" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">
                      Putting {blend.name} on your floor…
                    </p>
                    <p className="text-[0.7rem] text-muted-foreground">
                      This can take up to a minute.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/*
          THE LABEL IS NOT OPTIONAL AND NOT DISMISSIBLE. It renders with the
          result, inside the same figure, so it cannot be screenshotted away
          from what it describes.
        */}
        {phase.kind === 'done' && (
          <figcaption className="border-t border-border px-4 py-3">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary">
              AI visualization — for preview only
            </p>
            <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted-foreground text-pretty">
              Lighting, your concrete&apos;s condition, the flake blend itself and your screen all
              affect how the finished floor looks. Confirm your colour against physical samples —
              we bring them to every estimate.
            </p>
          </figcaption>
        )}
      </figure>

      {/* ----------------------------------------------------------- status */}
      {/*
        One polite live region for every state change. Screen-reader users get
        told that work started, finished or failed without the focus moving.
      */}
      <p aria-live="polite" className="sr-only">
        {busy
          ? `Generating a preview of your garage with ${blend.name}.`
          : phase.kind === 'done'
            ? `Preview ready. Showing ${blend.name} on your garage floor.`
            : phase.kind === 'failed'
              ? `Preview failed. ${phase.message}`
              : ''}
      </p>

      {inputError && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {inputError}
        </p>
      )}

      {phase.kind === 'failed' && (
        <div role="alert" className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground text-pretty">{phase.message}</p>
          {phase.retryable && (
            <button
              type="button"
              onClick={() => void run(phase.file, phase.previewUrl)}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------- controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/*
          Two inputs, not one. `capture` opens the camera directly on a phone,
          which is what somebody standing in their garage wants; without a
          second plain input, desktop and gallery users lose the ability to
          pick an existing file.
        */}
        <input
          ref={cameraRef}
          type="file"
          accept={PHOTO_ACCEPT}
          capture="environment"
          className="sr-only"
          id="viz-camera"
          onChange={(e) => accept(e.target.files?.[0])}
        />
        <input
          ref={fileRef}
          type="file"
          accept={PHOTO_ACCEPT}
          className="sr-only"
          id="viz-file"
          onChange={(e) => accept(e.target.files?.[0])}
        />

        <label
          htmlFor="viz-camera"
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background sm:hidden"
        >
          <Camera size={15} aria-hidden="true" />
          {phase.kind === 'empty' ? 'Take a photo' : 'Retake'}
        </label>

        <label
          htmlFor="viz-file"
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background"
        >
          {phase.kind === 'empty' ? <Upload size={15} aria-hidden="true" /> : <Images size={15} aria-hidden="true" />}
          {phase.kind === 'empty' ? 'Upload a photo' : 'Choose another'}
        </label>

        {phase.kind === 'done' && (
          <button
            type="button"
            aria-pressed={compare}
            onClick={() => setCompare((c) => !c)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {compare ? 'Show the preview' : 'Show my original'}
          </button>
        )}

        {phase.kind !== 'empty' && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <Trash2 size={15} aria-hidden="true" />
            Remove photo
          </button>
        )}
      </div>

      <p className="text-[0.7rem] leading-relaxed text-muted-foreground text-pretty">
        Your photo is used to generate the preview and is not kept. Stand back far enough to see the
        whole floor, open the garage door for light, and keep the camera straight.
      </p>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-3">
        <Camera size={26} className="text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">See the blend on your own garage floor</p>
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground text-pretty">
          Take or upload a photo of your garage. We change the floor and leave everything else —
          your door, your shelving, your light — where it is.
        </p>
      </div>
    </div>
  )
}
