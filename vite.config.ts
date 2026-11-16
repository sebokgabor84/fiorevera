/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Footer © year as a build-time constant: no `Date` in render paths (PRD D-18).
    __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: ['node_modules', 'dist', 'tests/e2e/**', 'tests/visual/**', '.claude/**', 'references/**', 'assets-src/**'], // Playwright specs + sibling worktrees
  },
});
