import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/',

  // ── Production build optimisations ──────────────────────────────
  build: {
    // No source maps in production — keeps proprietary logic private
    sourcemap: false,
    // Hard cap to flag unexpectedly large chunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split heavy vendors into separate cacheable chunks
        manualChunks: {
          'vendor-three':  ['three'],
          'vendor-charts': ['recharts'],
        },
        // Stable, content-hashed file names for long-term caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },

  // ── Strip console.* and debugger statements in production ────────
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },

  // ── Test configuration ───────────────────────────────────────────
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts'],
    },
  },
}));
