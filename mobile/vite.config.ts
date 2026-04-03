import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // exposes to local network — needed to test on your phone
    port: 5173,
  },
})
