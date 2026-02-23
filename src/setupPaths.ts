import { BASE_KEY, DEFAULT_REGEX, Errors } from './constants';
import type { ArgObj, IOptions, ResolveRetVal, URLParams } from './types';

/******************************************************************************
                                       Types                                    
******************************************************************************/

type CollpaseType2<T> = T extends unknown ? T : never;

// Must be defined in the file it is used in
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
>(pathObj: T, options?: U): CollpaseType2<CollapseType<ResolveRetVal<T, U>>> {
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
 * @private
 * @see setupPathsHelper
 *
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
  return (paramsArg?: URLParams) => {
    if (paramsArg === undefined) {
      return path;
    }
    const isParamObject = !!paramsArg && typeof paramsArg === 'object';
    // Check the number of keys
    if (strictKeyNames && isParamObject) {
      if (Object.keys(paramsArg).length !== paramIndexes.length) {
        throw new Error(Errors.STRICT_KEY_NAME_LENGTH);
      }
    }
    // Setup the URL to return
    const urlArrClone = [...urlArr];
    paramIndexes.forEach((index) => {
      const key = urlArrClone[index];
      if (isParamObject) {
        if (strictKeyNames && !(key in paramsArg)) {
          throw new Error(Errors.StrictKeyName(key));
        }
        urlArrClone[index] = String(paramsArg[key]);
      } else if (paramsArg !== undefined) {
        urlArrClone[index] = String(paramsArg);
      }
    });
    // Check the regex if truthy
    const finalUrl = (path.startsWith('/') ? '/' : '') + urlArrClone.join('/');
    if (!stripQueryAndHash(finalUrl, regex)) {
      throw new Error(Errors.REGEX);
    }
    return finalUrl;
  };
}

/**
 * @private
 * @see setupInsertUrlParamsFn
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

// /**
//  * Append query params from an object to an existing URL string.
//  * Works with absolute URLs and relative URLs in Node.js 24.
//  *
//  * @param {string} urlString - Existing URL (absolute or relative)
//  * @param {Record<string, any>} params - Object to convert into query params
//  * @returns {string} - URL string with appended query params
//  */
// function appendQueryParams(urlString, params = {}) {
//   // Use a dummy base so relative URLs can be parsed
//   const isAbsolute = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(urlString);
//   const base = 'http://localhost';
//   const url = new URL(urlString, base);

//   for (const [key, value] of Object.entries(params)) {
//     if (value == null) continue; // skip null / undefined

//     if (Array.isArray(value)) {
//       // Repeat key for arrays: ?tag=a&tag=b
//       for (const item of value) {
//         if (item != null) url.searchParams.append(key, String(item));
//       }
//     } else if (value instanceof Date) {
//       url.searchParams.append(key, value.toISOString());
//     } else if (typeof value === 'object') {
//       // Serialize nested objects as JSON
//       url.searchParams.append(key, JSON.stringify(value));
//     } else {
//       url.searchParams.append(key, String(value));
//     }
//   }

//   // Preserve relative URLs if input was relative
//   if (!isAbsolute) {
//     return `${url.pathname}${url.search}${url.hash}`;
//   }

//   return url.toString();
// }

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
  return setupInsertUrlParamsFn(path, strictKeyNames, regex);
}

/******************************************************************************
                                  Export
******************************************************************************/

export default setupPaths;
