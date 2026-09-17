import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { AnalyticsEvents } from '@/components/analytics-events'
import { GA4 } from '@/components/ga4'
import { GoogleTagManager, GoogleTagManagerNoscript } from '@/components/gtm'
import { MarketingChromeBottom, MarketingChromeTop } from '@/components/marketing-chrome'
import { MetaPixel } from '@/components/meta-pixel'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://houstonsuperiorepoxy.com'),
  alternates: { canonical: '/' },
  title: 'Garage Epoxy Flooring Houston | Houston Superior Epoxy',
  description:
    'Diamond-ground epoxy and polyaspartic floor systems for Houston garages, patios and commercial slabs. $2M insured, 5-year workmanship warranty, no upfront payment. Call (346) 782-0903.',
  generator: 'v0.app',
  /*
    No `keywords`. Google has ignored <meta name="keywords"> for ranking for
    well over a decade, so it added nothing while publicly listing the exact
    terms being targeted. Page titles, headings and body copy are what carry
    keyword relevance here.
  */
  openGraph: {
    title: 'Garage Epoxy Flooring Houston | Houston Superior Epoxy',
    description:
      'Diamond-ground, polyaspartic-topped epoxy floor systems for Houston garages, patios and commercial slabs.',
    /*
      og:url was absent sitewide. Resolved against `metadataBase`, so it emits
      the absolute apex URL and matches the canonical. Individual pages already
      pass their own `openGraph.url`; this supplies the homepage value and the
      default for anything that does not.
    */
    url: '/',
    type: 'website',
    locale: 'en_US',
    siteName: 'Houston Superior Epoxy',
    images: [
      {
        url: '/images/og-card.png',
        width: 1200,
        height: 630,
        alt: 'Houston Superior Epoxy — Strong Floors. Built to Impress.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Garage Epoxy Flooring Houston | Houston Superior Epoxy',
    description:
      'Diamond-ground, polyaspartic-topped epoxy floor systems for Houston garages, patios and commercial slabs.',
    images: ['/images/og-card.png'],
  },
  icons: {
    // The metallic "HSE" letters need a dark ground to stay legible, so the
    // brand ink is baked into every icon and one set serves both tab themes.
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#14181f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${inter.variable} ${playfair.variable}`}>
      {/* pb-16 on mobile clears the fixed call bar. */}
      <body className="antialiased pb-16 lg:pb-0">
        {/* GTM <noscript> must be the first thing inside <body> per Google. */}
        <GoogleTagManagerNoscript />
        {/*
          Header, footer, mobile call bar and the site-wide LocalBusiness
          JSON-LD. Split in two so `children` stays inside <main>, and grouped
          into a client component so all of it can be suppressed on /admin —
          see components/marketing-chrome.tsx.
        */}
        <MarketingChromeTop />
        <main>{children}</main>
        <MarketingChromeBottom />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {/*
          Google Tag Manager. Self-disables when NEXT_PUBLIC_GTM_ID is unset.
          Loads alongside GA4 and the Pixel, which fire directly so tracking
          works with or without a container — see components/gtm.tsx.
        */}
        <GoogleTagManager />
        {/*
          GA4. Self-disables when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset, so no
          third-party script or cookie ships until it is configured.
          Independent of the Vercel Analytics above, which stays as-is.
        */}
        <GA4 />
        {/*
          Meta Pixel. Self-disables when NEXT_PUBLIC_META_PIXEL_ID is unset,
          so no Pixel script or Meta cookie ships until it is configured. Its
          conversions are de-duplicated against the server Conversions API via a
          shared event id — see lib/meta.ts.
        */}
        <MetaPixel />
        {/*
          One delegated listener handles phone, SMS, email, scroll depth and
          gallery events for the whole site — see the component for why this is
          not wired per-CTA.
        */}
        <AnalyticsEvents />
      </body>
    </html>
  )
}
