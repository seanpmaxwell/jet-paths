/******************************************************************************
                               Constants
******************************************************************************/

// Errors
const BASE_KEY_KEY_ERROR = (key: string) => 'Base key must exist on every ' + 
  'object and the value must be a string: ' + key;
const STRICT_KEY_NAME_LENGTH_ERROR = 'Option :strictKeyNames is set to true but ' +
  'but the number of object keys did not match the number of url parameters.';
const STRICT_KEY_NAME_KEY_ERROR = (key: string) => 'Option :strictKeysNames'  +
  `is set to return true but the "${key}" was not present on the object.`;
const REGEX_FAILED_ERROR = 'URL failed regular expression check';

// Misc
const BASE_KEY = '_';
const DEFAULT_REGEX = /^[A-Za-z0-9_\/-]+$/;

/******************************************************************************
                                 Types
******************************************************************************/

type TUrlParam = string | number | boolean | null | undefined;
type TUrlParamObject = Record<string, TUrlParam>;
export type TUrlParams = TUrlParam | TUrlParamObject;
type TBaseKey = typeof BASE_KEY;

type TObject = { 
  '_': string;
  [key: string]: string | TObject;
};

interface IOptions {
  prepend?: string;
  strictKeyNames?: boolean;
  regex?: true | RegExp;
}

// **** Create the Recursive string type **** //

type TSetupPrefix<T extends TObject, U extends (IOptions | undefined)> = 
  undefined extends U 
  ? T[TBaseKey] 
  : U extends IOptions 
    ? U['prepend'] extends string 
      ? `${U['prepend']}${T[TBaseKey]}`
      : never
    : never;
  

// Recursively prefix all string paths in an object
type ExpandPaths<T extends TObject, Prefix extends string> = {
  [K in keyof T]: 
    T[K] extends string
      ? K extends '_'
        ? Prefix
        : Join<Prefix, T[K]>
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
    ? (urlParams?: TUrlParams) => S
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
  RetVal = Iterate<ExpandPaths<T, Prefix>>,
>(
  pathObj: T,
  options?: U,
): RetVal {
  const baseUrl = options?.prepend ?? '',
    strictKeyNames = options?.strictKeyNames ?? true;
  const regex = (
      options?.regex 
        ? options.regex === true 
          ? DEFAULT_REGEX
          : options.regex
        : null
  );
  return setupPathsHelper(pathObj, baseUrl, strictKeyNames, regex, 'root') as RetVal;
}

/**
 * The recursive function.
 */
function setupPathsHelper(
  parentObj: Record<string, string | TObject>,
  baseUrl: string,
  strictKeyNames: boolean,
  regex: null | RegExp,
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
        retVal[key] = setupInsertUrlParamsFn(finalUrl, strictKeyNames, regex);
      } else {
        retVal[key] = finalUrl; 
      }
    } else if (typeof pval === 'object') {
      retVal[key] = setupPathsHelper(pval, url, strictKeyNames, regex, key);
    }
  }
  // Return
  return retVal;
}

/**
 * Initialize the function which setups up the url params
 */
function setupInsertUrlParamsFn(
  path: string,
  strictKeyNames = true,
  regex: RegExp | null = null,
) {
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
  return (paramsArg?: TUrlParams) => {
    if (paramsArg === undefined) {
      return path;
    }
    const isParamObject = (!!paramsArg && typeof paramsArg === 'object');
    // Check the number of keys
    if (strictKeyNames && isParamObject) {
      if (Object.keys(paramsArg).length !== urlArr.length) {
        throw new Error(STRICT_KEY_NAME_LENGTH_ERROR);
      }
    }
    // Setup the URL to return
    const urlArrClone = [ ...urlArr ];
    paramIndexes.forEach((index) => {
      const key = urlArrClone[index];
      if (isParamObject) {
        if (strictKeyNames && !(key in paramsArg)) {
          throw new Error(STRICT_KEY_NAME_KEY_ERROR(key));
        }
        urlArrClone[index] = String(paramsArg[key]);
      } else if (paramsArg !== undefined) {
        urlArrClone[index] = String(paramsArg);
      }
    });
    // Check the regex if truthy
    const finalUrl = (path.startsWith('/') ? '/' : '') + urlArrClone.join('/');
    if (stripQueryAndHash(finalUrl, regex)) {
      throw new Error(REGEX_FAILED_ERROR);
    }
    return finalUrl;
  };
}

/**
 * Check the regex if truthy
 */
function stripQueryAndHash(fullPath: string, pathRegex: RegExp | null): boolean {
  if (!pathRegex) {
    return true;
  }
  return pathRegex.test(fullPath);
}

/**
 * Initialize the function which setups up the url params
 */
export function externalSetupInsertUrlParamsFn(
  path: string,
  options?: (Omit<IOptions, 'prepend'> | undefined),
) {
  const strictKeyNames = options?.strictKeyNames ?? true;
  const regex = (
      options?.regex 
        ? options.regex === true 
          ? DEFAULT_REGEX
          : options.regex
        : null
  );
  return setupInsertUrlParamsFn(path, strictKeyNames, regex);
}

/******************************************************************************
                            Export default
******************************************************************************/

export default setupPaths;
