import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) return 'vendor';
            if (id.includes('leaflet')) return 'leaflet';
            if (id.includes('dompurify')) return 'sanitize';
            if (id.includes('socket.io')) return 'socketio';
            if (id.includes('html2canvas')) return 'html2canvas';
            if (id.includes('jspdf')) return 'jspdf';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  }
})
