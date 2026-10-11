import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages publica en https://mactrioco.github.io/Yisus-D-Dev/
  // (con dominio propio, cámbialo a '/')
  base: '/Yisus-D-Dev/',
  plugins: [react(), tailwindcss()],
})
