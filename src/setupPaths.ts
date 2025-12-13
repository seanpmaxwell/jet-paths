/******************************************************************************
                               Constants
******************************************************************************/

const BASE_KEY_KEY = 'Base key must exist on the parent object and the ' + 
  'value must be a string';

const DEFAULT_OPTIONS = {
  baseKey: 'Root',
} as const;

/******************************************************************************
                                 Types
******************************************************************************/

export type TUrlParamValue = string | number | boolean | null | undefined;
export type TUrlParamArg = Record<string, TUrlParamValue>;
type TDefaultBaseKey = typeof DEFAULT_OPTIONS['baseKey'];

type TObject = { 
  [key: string]: string | TObject;
};

type GetStringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never
}[keyof T];

interface IOptions<BK> {
  baseKey?: BK;
  prepend?: string;
}

// **** Create the Recursive string type **** //

// Type-safe the base-key
type TBaseKey<T, U extends (IOptions<keyof T> | undefined)> = (
  U extends undefined
  ? TDefaultBaseKey
  : 'baseKey' extends keyof U
    ? U['baseKey'] extends keyof T
      ? U['baseKey'] 
      : never
    : TDefaultBaseKey
);

// Type-safe the prefix
type TCheckStringValueOfObject<T, BK> = (
  BK extends keyof T 
  ? T[BK] extends string 
    ? T[BK] 
    : never 
  : never
);

// Recursively prefix all string paths in an object
type ExpandPaths<T extends Record<string, any>, BK extends keyof T, Prefix extends string> = {
  [K in keyof T]: 
    T[K] extends string
      ? Join<Prefix, T[K]>
      : T[K] extends Record<string, any>
        ? ExpandPaths<T[K], BK, Join<Prefix, T[K][BK]>>
        : never;
};

// Joins two path segments, handling slashes cleanly.
type Join<A extends string, B extends string> =
  A extends "" ? B :
  B extends "" ? A :
  `${A}${B}`;


// **** Set string or function type **** //

type Iterate<T extends TObject> = { 
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
  T extends TObject,
  StringKeys extends GetStringKeys<T>,
  U extends (IOptions<StringKeys> | undefined),
  BK extends TBaseKey<T, U>,
  Prefix extends string = TCheckStringValueOfObject<T, BK>,
>(
  pathObj: T,
  options?: U,
): Iterate<ExpandPaths<T, BK, Prefix>> {
  // Init
  const baseKey = options?.baseKey ?? DEFAULT_OPTIONS.baseKey,
    baseUrl = options?.prepend ?? '';
  // Return
  return setupPathsHelper(
    pathObj,
    String(baseKey),
    baseUrl,
  ) as Iterate<ExpandPaths<T, BK, Prefix>>;
}

/**
 * The recursive function.
 */
function setupPathsHelper(
  parentObj: Record<string, string | TObject>,
  baseKey: string,
  baseUrl: string,
): Record<string, unknown> {
  // Validate base key
  if (typeof parentObj[baseKey] !== 'string') {
    throw new Error(BASE_KEY_KEY);
  }
  // Init vars
  const url = (baseUrl + (parentObj[baseKey])),
    keys = Object.keys(parentObj),
    retVal: any = { [baseKey]: url };
  // Iterate keys
  for (const key of keys) {
    const pval = parentObj[key];
    if (key !== baseKey && typeof pval === 'string') {
      const finalUrl = (url + pval);
      if (finalUrl.includes('/:')) {
        retVal[key] = setupInsertUrlParamsFn(finalUrl);
      } else {
        retVal[key] = finalUrl; 
      }
    } else if (typeof pval === 'object') {
      retVal[key] = setupPathsHelper(pval, baseKey, url);
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
