import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Calculation tests do not render React, so avoid requiring an unused DOM runtime.
    environment: 'node',
    globals: true,
    include: ['lib/**/*.test.ts'],
  },
});
