import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',

  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    target: 'es2022',
    modulePreload: {
      polyfill: false,
    },
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-auth': ['@react-oauth/google', 'jwt-decode', 'react-router-dom'],
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },

  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    target: 'es2022',
  },

  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      target: 'es2022',
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/core/**/*.ts',
        'src/engine/**/*.ts',
        'src/ethics/**/*.ts',
        'src/utils/**/*.ts',
        'src/types/**/*.ts',
        'src/hooks/**/*.ts',
      ],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 50,
        statements: 70,
      },
    },
  },
}));
