import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/Jr_AstroCamp/',
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/.venv/**', '**/saves/**', '**/__pycache__/**', '**/*.zip', '**/*.glb', '**/*.stl'],
    },
  },
})