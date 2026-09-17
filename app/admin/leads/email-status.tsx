'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import type { EmailDiagnostic } from '@/lib/email'
import { sendTestEmail } from './actions'

/*
  Email setup panel.

  Exists because email failed silently twice: the reason was written to a
  server log the owner cannot read, so "the form is broken" and "the form works
  but Resend rejected the sender" looked identical from their side.

  This runs a real send on demand and prints the provider's actual response.
*/
export function EmailStatus({ configured }: { configured: boolean }) {
  const [result, setResult] = useState<EmailDiagnostic | null>(null)
  const [recipient, setRecipient] = useState('')
  const [pending, startTransition] = useTransition()

  function run() {
    startTransition(async () => {
      const r = await sendTestEmail(recipient)
      setResult('unauthorized' in r ? null : r)
    })
  }

  return (
    <section className="mt-6 border border-border bg-card/40 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Email notifications</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {configured
              ? 'Send yourself a test to confirm leads will reach your inbox.'
              : 'RESEND_API_KEY is not set, so no email is sent. Leads are still captured and listed below.'}
          </p>
        </div>
        <Button type="button" onClick={run} disabled={pending} variant="outline" size="sm">
          {pending ? 'Sending…' : 'Send test email'}
        </Button>
      </div>

      {/*
        Sending to a different address is the one test that separates "mail is
        not going out" from "mail is going out and being filtered on arrival".
        Those two look identical from an empty inbox, so it is worth a field.
      */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <label htmlFor="test-recipient" className="text-[0.7rem] text-muted-foreground">
          Send to a different address (optional)
        </label>
        <input
          id="test-recipient"
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="you@gmail.com"
          autoComplete="off"
          className="min-w-52 flex-1 border border-border bg-background px-2 py-1 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {result ? (
        <div
          role="status"
          className={`mt-4 border-l-2 px-3 py-3 text-xs leading-relaxed ${
            result.ok ? 'border-primary bg-background' : 'border-destructive bg-background'
          }`}
        >
          {result.ok ? (
            <div className="flex flex-col gap-2">
              {/*
                "Sent" was the misleading part: Resend accepting a message says
                nothing about whether the receiving server took it. Reporting the
                confirmed delivery separately is the difference between a guess
                and an answer.
              */}
              <p className="text-foreground">
                <span className="font-medium">
                  {result.delivery === 'delivered' ? 'Delivered.' : 'Test email sent.'}
                </span>{' '}
                Check <span className="font-mono">{result.to.join(', ')}</span>. If it is not there
                within a minute, look in spam.
              </p>
              {/*
                A send can succeed from a weak sender that only reaches one
                inbox. That caveat matters as much as the failure text, so it
                is shown here rather than only on errors.
              */}
              {result.hint && result.hint.includes(' ') ? (
                <p className="text-muted-foreground">{result.hint}</p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground">Email did not send.</p>
              {/*
                The provider's message verbatim. A paraphrase here is what makes
                this class of problem hard to fix.
              */}
              <p className="font-mono text-[0.7rem] text-destructive">{result.error}</p>
              {result.hint ? <p className="text-muted-foreground">{result.hint}</p> : null}
            </div>
          )}

          <dl className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-[0.7rem] text-muted-foreground">
            <div className="flex gap-2">
              <dt className="w-16 shrink-0">From</dt>
              <dd className="font-mono break-all">{result.from}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0">To</dt>
              <dd className="font-mono break-all">{result.to.join(', ') || '—'}</dd>
            </div>
            {result.verifiedDomains ? (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0">Verified</dt>
                <dd className="font-mono break-all">
                  {result.verifiedDomains.length > 0 ? result.verifiedDomains.join(', ') : 'none'}
                </dd>
              </div>
            ) : null}
            {/* Resend's own verdict, so the inbox is not the only evidence. */}
            {result.delivery ? (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0">Delivery</dt>
                <dd className="font-mono break-all">
                  {result.delivery}
                  {result.deliveryDetail ? ` — ${result.deliveryDetail}` : ''}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </section>
  )
}
