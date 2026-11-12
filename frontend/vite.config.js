import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || viteEnv.VITE_FIREBASE_API_KEY
  if (mode === 'production' && (!firebaseApiKey || firebaseApiKey.startsWith('your_'))) {
    throw new Error('VITE_FIREBASE_API_KEY must be configured for the intervue-ai-003 Firebase web app before building for production.')
  }

  return {
    plugins: [react(),tailwindcss()],
  }
})
