/******************************************************************************
                               Constants
******************************************************************************/

const BASE_KEY_KEY = 'Base key must exist on every object and the value ' + 
  'must be a string';

/******************************************************************************
                                 Types
******************************************************************************/

export type TUrlParamValue = string | number | boolean | null | undefined;
export type TUrlParamArg = Record<string, TUrlParamValue>;

type IObject = { 
  '_': string;
  [key: string]: string | IObject;
};

interface IOptions {
  prepend?: string;
}

// **** Create the Recursive string type **** //

// Recursively prefix all string paths in an object
type ExpandPaths<T extends IObject, Prefix extends string> = {
  [K in keyof T]: 
    T[K] extends string
      ? Join<Prefix, T[K]>
      : T[K] extends IObject
        ? ExpandPaths<T[K], Join<Prefix, T[K]['_']>>
        : never;
};

// Joins two path segments, handling slashes cleanly.
type Join<A extends string, B extends string> =
  A extends "" ? B :
  B extends "" ? A :
  `${A}${B}`;


// **** Set string or function type **** //

type Iterate<T extends object> = { 
  [K in keyof T]: (
    T[K] extends string 
      ? ResolveType<T[K]> 
      : T[K] extends object
        ? Iterate<T[K]> 
        : never
  )
};

type ResolveType<S extends string> =
  S extends `${string}/:${string}`
    ? (urlParams?: TUrlParamArg | TUrlParamValue) => S
    : S;

/******************************************************************************
                               Functions
******************************************************************************/

/**
 * Format path object.
 */
function setupPaths<
  const T extends IObject,
  U extends (IOptions | undefined),
>(
  pathObj: T,
  options?: U,
): Iterate<ExpandPaths<T, T['_']>> {
  const baseUrl = options?.prepend ?? '';
  return setupPathsHelper(pathObj, baseUrl) as Iterate<ExpandPaths<T, T['_']>>;
}

/**
 * The recursive function.
 */
function setupPathsHelper(
  parentObj: Record<string, string | IObject>,
  baseUrl: string,
): Record<string, unknown> {
  // Validate base key
  if (typeof parentObj['_'] !== 'string') {
    throw new Error(BASE_KEY_KEY);
  }
  // Init vars
  const url = (baseUrl + (parentObj['_'])),
    keys = Object.keys(parentObj),
    retVal: any = { root: url };
  // Iterate keys
  for (const key of keys) {
    const pval = parentObj[key];
    if (key !== '_' && typeof pval === 'string') {
      const finalUrl = (url + pval);
      if (finalUrl.includes('/:')) {
        retVal[key] = setupInsertUrlParamsFn(finalUrl);
      } else {
        retVal[key] = finalUrl; 
      }
    } else if (typeof pval === 'object') {
      retVal[key] = setupPathsHelper(pval, url);
    }
  }
  // Return
  return retVal;
}

/**
 * Initialize the function which setups up the url params
 */
export function setupInsertUrlParamsFn(path: string) {
  const urlArr = path.split('/').filter(Boolean);
  // Get the indexes where a variable exists
  const paramIndexes: number[] = [];
  urlArr.forEach((param, i) => {
    if (param.startsWith(':')) {
      paramIndexes.push(i);
      urlArr[i] = urlArr[i].slice(1);
    }
  });
  // Return the InsertUrlParams function
  return (paramsArg?: TUrlParamArg | TUrlParamValue) => {
    if (paramsArg === undefined) {
      return path;
    }
    const urlArrClone = [ ...urlArr ];
    paramIndexes.forEach((index) => {
      const key = urlArrClone[index];
      if (!!paramsArg && typeof paramsArg === 'object') {
        urlArrClone[index] = String(paramsArg[key]);
      } else if (paramsArg !== undefined) {
        urlArrClone[index] = String(paramsArg);
      }
    });
    return ((path.startsWith('/') ? '/' : '') + urlArrClone.join('/'));
  };
}

/******************************************************************************
                            Export default
******************************************************************************/

export default setupPaths;
