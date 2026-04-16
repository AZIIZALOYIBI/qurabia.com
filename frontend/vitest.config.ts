import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment
    environment: 'jsdom',

    // Global setup and teardown
    globals: true,
    setupFiles: ['./src/test/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/__tests__/**',
        'dist/',
        '.{idea,git,cache,output,temp}/',
        '{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      ],

      // Coverage thresholds
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },

      // Include all source files
      all: true,
      include: ['src/**/*.{ts,tsx}'],
    },

    // Test execution
    testTimeout: 10000,
    hookTimeout: 10000,

    // Performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },

    // Reporter configuration
    reporters: ['default', 'html'],
    outputFile: {
      html: './coverage/test-report.html',
    },

    // Include/exclude patterns
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      '**/node_modules/**',
      '**/dist/**',
    ],

    // Watch mode
    watch: false,

    // Fail on console errors (optional, can be strict)
    // onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
    //   if (type === 'stderr' && log.includes('error')) {
    //     return false;
    //   }
    // },

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Snapshot configuration
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace(/\.test\.([tj]sx?)/, `${snapExtension}.$1`);
    },
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@core': path.resolve(__dirname, './src/core'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@ethics': path.resolve(__dirname, './src/ethics'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@test': path.resolve(__dirname, './src/test'),
    },
  },

  // Build configuration for tests
  build: {
    sourcemap: true,
  },

  // Server configuration for tests
  server: {
    deps: {
      inline: ['vitest-canvas-mock'],
    },
  },
});
