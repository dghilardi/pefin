import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://pefin-api.deno.dev',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.ico', "apple-touc-icon.png", "masked-icon.svg"],
    manifest: {
      name: "Pefin",
      short_name: "Pefin",
      description: "Personal finance app",
      icons: [{
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'favicon'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'favicon'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'apple touch icon',
      },
      {
        src: '/maskable_icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      }
      ],
      theme_color: '#171717',
      background_color: '#8de9c7',
      display: "standalone",
      scope: '/',
      start_url: "/",
      orientation: 'portrait'
    }
  })],
})
