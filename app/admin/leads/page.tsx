import { desc } from 'drizzle-orm'
import type { Metadata } from 'next'
import { isAdminAuthed, isAdminConfigured } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { estimateLeads } from '@/lib/db/schema'
import { EmailStatus } from './email-status'
import { AdminLogin } from './login-form'
import { LeadCard } from './lead-card'
import { LogoutButton } from './logout-button'

/*
  Internal lead inbox. Not part of the marketing site.

  `noindex, nofollow` is belt-and-braces alongside the robots.txt disallow and
  the password gate: this page must never appear in search results, and a
  Disallow rule alone does not guarantee de-indexing if the URL is discovered
  some other way.
*/
export const metadata: Metadata = {
  title: 'Lead inbox',
  robots: { index: false, follow: false, nocache: true },
}

/*
  Always render fresh. A cached lead list is worse than useless to someone
  checking whether a new enquiry arrived.
*/
export const dynamic = 'force-dynamic'

export default async function AdminLeadsPage() {
  const configured = isAdminConfigured()
  const authed = configured && (await isAdminAuthed())

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <AdminLogin configured={configured} />
      </main>
    )
  }

  const leads = await db.select().from(estimateLeads).orderBy(desc(estimateLeads.createdAt))

  const newCount = leads.filter((l) => l.status === 'new').length
  const emailConfigured = Boolean(process.env.RESEND_API_KEY)

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
            Houston Superior Epoxy
          </p>
          <h1 className="mt-1 font-serif text-3xl text-foreground">Lead inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {leads.length} total
            {newCount > 0 ? (
              <>
                {' · '}
                <span className="font-medium text-primary">{newCount} new</span>
              </>
            ) : null}
          </p>
        </div>
        <LogoutButton />
      </header>

      {/*
        Surfaced in the UI rather than only in server logs, because "the form
        works but nobody is being emailed" is exactly the silent failure that
        prompted building this page. The owner should not have to read runtime
        logs to discover it, and the test button turns a vague symptom into the
        provider's actual error message.
      */}
      <EmailStatus configured={emailConfigured} />

      {leads.length === 0 ? (
        <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
          No leads yet. Submissions from the estimate form will appear here immediately.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {leads.map((lead) => (
            <li key={lead.id}>
              <LeadCard lead={lead} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
