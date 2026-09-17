import type { Metadata } from 'next'

/*
  Everything under /admin is internal, so it is noindexed here in one place
  rather than per page.

  NOTE: this layout does NOT remove the marketing header/footer. A nested
  layout renders INSIDE its parent, so it cannot strip the root layout's
  chrome. The actual hiding is done by <MarketingChrome> in app/layout.tsx,
  which returns null on /admin. The alternative — moving all 25 public routes
  into a (marketing) route group — is a large diff for a cosmetic win.
*/
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>
}
