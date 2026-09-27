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
 * Run a command and resolve with its stdout (without the trailing newline).
 * Output is also streamed to this process as it happens. Uses the built-in
 * `child_process`, so it works on every supported Node version. No shell is
 * involved: pass each argument separately.
 *
 * Rejects if the command can't be started or exits with a non-zero code.
 */
function shell(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['inherit', 'pipe', 'pipe'] });
    // Decode as UTF-8 so a character split across chunks isn't mangled
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    let stdout = '';
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk: string) => {
      process.stderr.write(chunk);
    });
    // e.g. the command doesn't exist (ENOENT)
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve(stdout.replace(/\r?\n$/, ''));
        return;
      }
      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`"${[cmd, ...args].join(' ')}" failed with ${reason}`));
    });
  });
}
