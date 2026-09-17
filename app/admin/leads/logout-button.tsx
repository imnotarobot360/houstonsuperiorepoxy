'use client'

import { logout } from './actions'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  )
}
