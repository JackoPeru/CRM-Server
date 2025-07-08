import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Consente l'accesso da qualsiasi IP della rete locale
    port: 5173, // PORTA STANDARD 5173
    strictPort: true, // Usa SEMPRE la porta 5173
    clearScreen: false,
    https: false, // Disabilita HTTPS per evitare problemi con certificati auto-firmati in rete
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          icons: ['lucide-react']
        }
      }
    }
  },
  base: './',
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
