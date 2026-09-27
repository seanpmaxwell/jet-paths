import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default defineConfig({
  // Resolve the tsconfig "paths" aliases (i.e. "@src/*")
  resolve: { tsconfigPaths: true },
  test: {
    include: [
      'test/index.test.ts',
      'test/ai/ai.test.ts',
      'test/ai/regressions.test.ts',
      'test/**/browser.test.ts',
    ],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' },
        { browser: 'firefox' },
        { browser: 'webkit' },
      ],
    },
  },
});
