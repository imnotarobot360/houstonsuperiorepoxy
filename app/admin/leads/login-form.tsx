'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { login } from './actions'

/*
  Login gate. Renders a setup explanation instead of a form when
  ADMIN_PASSWORD is missing, because a password box that cannot succeed is a
  worse experience than being told why.
*/
export function AdminLogin({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(login, null)

  if (!configured) {
    return (
      <div>
        <h1 className="font-serif text-2xl text-foreground">Admin not configured</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This page is locked because no{' '}
          <code className="font-mono text-xs">ADMIN_PASSWORD</code> is set on the project. Add one in
          your Vercel project settings, then reload.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Leads are still being captured in the database in the meantime — nothing is being lost
          while this is unset.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
        Houston Superior Epoxy
      </p>
      <h1 className="mt-1 font-serif text-2xl text-foreground">Lead inbox</h1>

      <form action={formAction} className="mt-6 flex flex-col gap-3">
        <label htmlFor="password" className="text-sm text-muted-foreground">
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className="border border-border bg-card/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? 'Checking…' : 'Sign in'}
        </Button>
        {state?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
      </form>
    </div>
  )
}
