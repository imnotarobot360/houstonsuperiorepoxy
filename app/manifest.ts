import type { MetadataRoute } from 'next'

// Served at /manifest.webmanifest
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Houston Superior Epoxy',
    short_name: 'HSE Epoxy',
    description:
      'Diamond-ground, polyaspartic-topped epoxy floor systems for Houston garages, patios and commercial slabs.',
    start_url: '/',
    display: 'standalone',
    background_color: '#14181f',
    theme_color: '#14181f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
