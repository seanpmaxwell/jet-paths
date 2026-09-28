import { spawn } from 'child_process';
import { build as esbuild } from 'esbuild';
import fs from 'fs/promises';
import logger from 'jet-logger';

import onInit from './onInit';

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

await onInit(async () => {
  // --- Delete and recreate the folder to keep things clean
  await fs.rm('./lib', { recursive: true, force: true });

  // ---- Typecheck
  // A type error rejects, so `onInit` exits non-zero before anything is built.
  await shell('tsc', ['-p', 'tsconfig.build.json', '--noEmit']);

  // ---- Bundle types
  await shell('dts-bundle-generator', [
    '--project',
    'tsconfig.build.json',
    '-o',
    'lib/index.d.ts',
    'src/index.ts',
  ]);

  // ---- Build and bundle runtime code
  await esbuild({
    entryPoints: {
      index: 'src/index.ts',
    },
    outdir: 'lib',
    bundle: true,
    splitting: true,
    minify: true,
    format: 'esm',
    platform: 'node',
  });

  // ---- Finish
  logger.info('Finished building. Output written to "lib/"');
}, 'build');

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Run a command with this process's standard streams. Uses the built-in
 * `child_process`, so it works on every supported Node version. No shell is
 * involved: pass each argument separately.
 *
 * Rejects if the command can't be started or exits with a non-zero code.
 */
function shell(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    // e.g. the command doesn't exist (ENOENT)
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`"${[cmd, ...args].join(' ')}" failed with ${reason}`));
    });
  });
}
