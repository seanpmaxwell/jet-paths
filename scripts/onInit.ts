import logger from 'jet-logger';

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Wrap a module's top-level entry logic (scripts, playgrounds). The callback
 * runs immediately; if it throws, the error is logged with `cbName` for
 * context and then rethrown so the process still exits non-zero.
 */
async function onInit<T>(cb: () => Promise<T>, cbName?: string): Promise<T> {
  try {
    return await cb();
  } catch (err) {
    logger.err(`onInit function "${cbName}" failed:`, err);
    throw err;
  }
}

/**
 * Same as above but synchronous.
 */
function sync<T>(cb: () => T, cbName?: string): T {
  try {
    return cb();
  } catch (err) {
    logger.err(`onInit.sync function "${cbName}" failed:`, err);
    throw err;
  }
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

onInit.sync = sync;

export default onInit;
