import jetPaths, { externalSetupInsertUrlParamsFn } from './setupPaths.js';

/******************************************************************************
                                 Export
******************************************************************************/

export { type URLParams } from './types.js';
export const insertUrlParams = externalSetupInsertUrlParamsFn;
export default jetPaths;
