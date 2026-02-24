import { BASE_KEY, DEFAULT_REGEX, Errors } from './constants';
import type {
  ArgObj,
  IOptions,
  PlainDataObject,
  RetVal,
  URLParams,
} from './types';

/******************************************************************************
                                   Constants
******************************************************************************/

const APPEND_QUERY_PARAMS_BASE = 'https://localhost';

/******************************************************************************
                                   Types
******************************************************************************/

type CollapseType<T> = {
  -readonly [K in keyof T]: T[K];
} & {};

/******************************************************************************
                                  Functions
******************************************************************************/

/**
 * Format path object.
 */
function setupPaths<
  const T extends ArgObj,
  const U extends IOptions | undefined,
>(pathObj: T, options?: U): CollapseType<RetVal<T, U>> {
  // Setup baseUrl/keynames
  const baseUrl = options?.prepend ?? '',
    strictKeyNames = options?.strictKeyNames ?? true;
  // Init regex
  const regex = options?.regex
    ? options.regex === true
      ? DEFAULT_REGEX
      : options.regex
    : null;
  // Return
  return setupPathsHelper(
    pathObj,
    baseUrl,
    strictKeyNames,
    regex,
    'root',
  ) as any;
}

/**
 * @private
 * @see setupPaths
 *
 * The recursive function.
 */
function setupPathsHelper(
  parentObj: Record<string, string | ArgObj>,
  baseUrl: string,
  strictKeyNames: boolean,
  regex: null | RegExp,
  parentName: string,
): Record<string, unknown> {
  // Validate base key
  if (typeof parentObj[BASE_KEY] !== 'string') {
    throw new Error(Errors.BaseKey(parentName));
  }
  // Init vars
  const url = baseUrl + parentObj[BASE_KEY],
    keys = Object.keys(parentObj),
    retVal: any = { [BASE_KEY]: url };
  // Iterate keys
  for (const key of keys) {
    const pval = parentObj[key];
    if (key !== BASE_KEY && typeof pval === 'string') {
      const finalUrl = url + pval;
      if (finalUrl.includes('/:') || finalUrl.endsWith('+?')) {
        retVal[key] = setupHandleParamsFn(finalUrl, strictKeyNames, regex);
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
 * @private
 * @see setupPathsHelper
 *
 * Initialize the function which setups up the url params
 */
function setupHandleParamsFn(
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

  // pick up here, here have two if statements which check if ends with +?
  // pass the URL without +?, and return different functions with pathParams/searchParams
  // as different parameters. Each function will call `handleURLParams`
  console.log();

  // Return the InsertUrlParams function
  // return (pathParams?: URLParams) => {
  //   if (pathParams === undefined) {
  //     return path;
  //   }
  //   const isParamObject = !!pathParams && typeof pathParams === 'object';
  //   // Check the number of keys
  //   if (strictKeyNames && isParamObject) {
  //     if (Object.keys(pathParams).length !== paramIndexes.length) {
  //       throw new Error(Errors.STRICT_KEY_NAME_LENGTH);
  //     }
  //   }
  //   // Setup the URL to return
  //   const urlArrClone = [...urlArr];
  //   paramIndexes.forEach((index) => {
  //     const key = urlArrClone[index];
  //     if (isParamObject) {
  //       if (strictKeyNames && !(key in pathParams)) {
  //         throw new Error(Errors.StrictKeyName(key));
  //       }
  //       urlArrClone[index] = String(pathParams[key]);
  //     } else if (pathParams !== undefined) {
  //       urlArrClone[index] = String(pathParams);
  //     }
  //   });
  //   // Check the regex if truthy
  //   const finalUrl = (path.startsWith('/') ? '/' : '') + urlArrClone.join('/');
  //   if (!stripQueryAndHash(finalUrl, regex)) {
  //     throw new Error(Errors.REGEX);
  //   }
  //   return finalUrl;
  // };
}

/**
 * @private
 * @see setupPathsHelper
 *
 * Initialize the function which setups up the url params
 */
function handleURLParams(
  url: string,
  strictKeyNames: boolean,
  regex: RegExp | null = null,
  pathParams?: URLParams,
  searchParams?: PlainDataObject,
): string {
  if (pathParams === undefined) {
    return path;
  }
  const isParamObject = !!pathParams && typeof pathParams === 'object';
  // Check the number of keys
  if (strictKeyNames && isParamObject) {
    if (Object.keys(pathParams).length !== paramIndexes.length) {
      throw new Error(Errors.STRICT_KEY_NAME_LENGTH);
    }
  }
  // Setup the URL to return
  const urlArrClone = [...urlArr];
  paramIndexes.forEach((index) => {
    const key = urlArrClone[index];
    if (isParamObject) {
      if (strictKeyNames && !(key in pathParams)) {
        throw new Error(Errors.StrictKeyName(key));
      }
      urlArrClone[index] = String(pathParams[key]);
    } else if (pathParams !== undefined) {
      urlArrClone[index] = String(pathParams);
    }
  });
  // Check the regex if truthy
  const finalUrl = (path.startsWith('/') ? '/' : '') + urlArrClone.join('/');
  if (!stripQueryAndHash(finalUrl, regex)) {
    throw new Error(Errors.REGEX);
  }
  return finalUrl;
}

/**
 * @private
 * @see setupHandleParamsFn
 *
 * Check the regex if truthy
 */
function stripQueryAndHash(
  fullPath: string,
  pathRegex: RegExp | null,
): boolean {
  if (!pathRegex) {
    return true;
  }
  return pathRegex.test(fullPath);
}

/**
 * @private
 * @see setupPathsHelper
 *
 * Append query params from an object to an existing URL string. Works with
 * absolute URLs and relative URLs in Node.js 24.
 */
function appendSearchParams(urlStr: string, params: PlainDataObject): string {
  const url = new URL(urlStr.slice(0, -2), APPEND_QUERY_PARAMS_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value instanceof Date) {
      url.searchParams.append(key, value.toISOString());
    } else if (typeof value === 'object') {
      url.searchParams.append(key, JSON.stringify(value));
    } else {
      url.searchParams.append(key, String(value));
    }
  }
  return url.toString().slice(APPEND_QUERY_PARAMS_BASE.length);
}

// ------------------------ Independent Functions -------------------------- //

/**
 * Initialize the function which setups up the url params
 */
export function externalSetupInsertUrlParamsFn(
  path: string,
  options?: Omit<IOptions, 'prepend'> | undefined,
) {
  const strictKeyNames = options?.strictKeyNames ?? true;
  const regex = options?.regex
    ? options.regex === true
      ? DEFAULT_REGEX
      : options.regex
    : null;
  return setupHandleParamsFn(path, strictKeyNames, regex);
}

/******************************************************************************
                                  Export
******************************************************************************/

export default setupPaths;
