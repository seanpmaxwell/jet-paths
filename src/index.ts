import jetPaths, { setupInsertUrlParamsFn, type TUrlParamArg } from './setupPaths.js';

export type TUrlParams = TUrlParamArg;
export const insertUrlParams = setupInsertUrlParamsFn;
export default jetPaths;
