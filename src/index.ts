import jetPaths, { setupExternalFormatURLFn } from './setupPaths.js';

/******************************************************************************
                                 Export
******************************************************************************/

export { type URLParams } from './types.js';
export const insertUrlParams = setupExternalFormatURLFn;
export default jetPaths;
