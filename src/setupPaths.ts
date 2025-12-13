/******************************************************************************
                               Constants
******************************************************************************/

const BASE_KEY_KEY_ERROR = (key: string) => 'Base key must exist on every ' + 
  'object and the value must be a string: ' + key;
const BASE_KEY = '_';


/******************************************************************************
                                 Types
******************************************************************************/

export type TUrlParamValue = string | number | boolean | null | undefined;
export type TUrlParamArg = Record<string, TUrlParamValue>;
type TBaseKey = typeof BASE_KEY;

type TObject = { 
  '_': string;
  [key: string]: string | TObject;
};

interface IOptions {
  prepend: string;
}

// **** Create the Recursive string type **** //

type TSetupPrefix<T extends TObject, U extends (IOptions | undefined)> = 
  undefined extends U 
  ? T[TBaseKey] 
  : U extends IOptions 
    ? `${U['prepend']}${T[TBaseKey]}` 
    : never;
  

// Recursively prefix all string paths in an object
type ExpandPaths<T extends TObject, Prefix extends string> = {
  [K in keyof T]: 
    T[K] extends string
      ? Join<Prefix, T[K]>
      : T[K] extends TObject
        ? ExpandPaths<T[K], Join<Prefix, T[K][TBaseKey]>>
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
  const T extends TObject,
  const U extends (IOptions | undefined),
  Prefix extends string = TSetupPrefix<T, U>,
  RV = Iterate<ExpandPaths<T, Prefix>>,
>(
  pathObj: T,
  options?: U,
): RV {
  const baseUrl = options?.prepend ?? '';
  return setupPathsHelper(pathObj, baseUrl, 'root') as RV;
}

/**
 * The recursive function.
 */
function setupPathsHelper(
  parentObj: Record<string, string | TObject>,
  baseUrl: string,
  parentName: string,
): Record<string, unknown> {
  // Validate base key
  if (typeof parentObj[BASE_KEY] !== 'string') {
    throw new Error(BASE_KEY_KEY_ERROR(parentName));
  }
  // Init vars
  const url = (baseUrl + (parentObj[BASE_KEY])),
    keys = Object.keys(parentObj),
    retVal: any = { [BASE_KEY]: url };
  // Iterate keys
  for (const key of keys) {
    const pval = parentObj[key];
    if (key !== BASE_KEY && typeof pval === 'string') {
      const finalUrl = (url + pval);
      if (finalUrl.includes('/:')) {
        retVal[key] = setupInsertUrlParamsFn(finalUrl);
      } else {
        retVal[key] = finalUrl; 
      }
    } else if (typeof pval === 'object') {
      retVal[key] = setupPathsHelper(pval, url, key);
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
