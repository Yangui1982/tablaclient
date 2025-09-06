import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  // On ne lit que les variables VITE_ du front (si tu en ajoutes plus tard)
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // Si pas d'URL distante, on utilise le proxy vers Rails local
  const useProxy = !env.VITE_API_BASE_URL

  const proxy = useProxy
    ? {
        '/api': { target: 'http://localhost:3000', changeOrigin: true },
        '/rails/active_storage': { target: 'http://localhost:3000', changeOrigin: true },
      }
    : undefined

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy, // <= on utilise la variable ici
    },
    preview: {
      port: 4173,
      proxy, // <= et aussi ici pour `npm run preview`
    },
  }
})
