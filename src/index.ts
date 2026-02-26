import jetPaths, { setupExternalFormatURLFn } from './setupPaths.js';

/******************************************************************************
                                 Export
******************************************************************************/

export { type PathParams as URLParams } from './types.js';
export const formatURL = setupExternalFormatURLFn;
export default jetPaths;
