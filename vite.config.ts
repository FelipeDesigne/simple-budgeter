import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: '/simple-budgeter/',
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify('https://ofznhnwxiksocrmtcbnb.supabase.co'),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mem5obnd4aWtzb2NybXRjYm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzA1ODEsImV4cCI6MjA1MTI0NjU4MX0.Me3JWvTv7r_uqP_FEBd3kfeHVTmiX31Vv4taRx0sSVQ'),
    },
  }
});
