import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// host + polling make HMR work when the dev server runs inside a container.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
})
