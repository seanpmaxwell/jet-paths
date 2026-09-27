import { configDefaults, defineConfig } from 'vitest/config';

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default defineConfig({
  // Resolve the tsconfig "paths" aliases (i.e. "@src/*")
  resolve: { tsconfigPaths: true },
  test: {
    exclude: [...configDefaults.exclude, 'test/**/browser.test.ts'],
  },
});
