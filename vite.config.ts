import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      workbox: { globIgnores: ['**/ocr/**','**/node_modules/**/*','sw.js','workbox-*.js'] },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ANCFCC Agent Pro',
        short_name: 'ANCFCC Pro',
        description: 'Gestion professionnelle des demandes foncières',
        theme_color: '#12372A',
        background_color: '#F4F7F5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
