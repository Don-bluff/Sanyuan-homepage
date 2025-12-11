import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Don\'t Bluff Me - Poker App',
    short_name: 'Don\'t Bluff Me',
    description: 'Authentic poker insights and hand tracking application',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/LOGO/LOGO.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/LOGO/LOGO.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
    categories: ['games', 'entertainment', 'utilities'],
  }
}
