import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: GitHub Pages serves the app under /atomic-playground/; local dev
// stays at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/atomic-playground/' : '/',
  plugins: [react(), tailwindcss()],
}))
