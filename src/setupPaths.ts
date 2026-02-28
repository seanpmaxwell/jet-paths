import { BASE_KEY, Errors, REGEX } from './constants';
import type {
  ArgObj,
  IOptions,
  PathValues,
  RetVal,
  SearchValues,
} from './types';

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
  const baseUrl = options?.prepend ?? '';
  return setupPathsHelper(pathObj, baseUrl, '', 'root') as any;
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
  parentUrl: string,
  parentName: string,
): Record<string, unknown> {
  // Validate base key
  if (typeof parentObj[BASE_KEY] !== 'string') {
    throw new Error(Errors.BaseKey(parentName));
  }
  // Init vars
  const localBaseUrl = parentUrl + parentObj[BASE_KEY],
    keys = Object.keys(parentObj),
    retVal: any = { [BASE_KEY]: localBaseUrl };
  // Iterate keys
  for (const key of keys) {
    const pathItem = parentObj[key];
    if (typeof pathItem === 'string' && key !== BASE_KEY) {
      const fullUrl = localBaseUrl + pathItem;
      retVal[key] = setupFormatURLFn(baseUrl, fullUrl);
    } else if (typeof pathItem === 'object') {
      retVal[key] = setupPathsHelper(pathItem, baseUrl, localBaseUrl, key);
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
function setupFormatURLFn(baseUrl: string, fullUrl: string) {
  const segmentArr = fullUrl.split('/').filter(Boolean),
    pathVarCount = segmentArr.filter((p) => p.startsWith(':')).length;
  // Return function to insert pathValues
  if (pathVarCount > 0) {
    return (pathValues?: PathValues, searchValues?: SearchValues): string => {
      let finalUrl = insertPathParams(
        fullUrl,
        segmentArr,
        pathVarCount,
        pathValues,
      );
      finalUrl += setupSearchParams(searchValues);
      finalUrl = finalUrl || fullUrl;
      if (!!finalUrl && !REGEX.test(finalUrl)) {
        throw new Error(Errors.Regex(finalUrl));
      }
      return baseUrl + finalUrl;
    };
    // Return function only insert search values
  } else {
    return (searchValues?: SearchValues): string => {
      let finalUrl = fullUrl + setupSearchParams(searchValues);
      finalUrl = finalUrl || fullUrl;
      if (!!finalUrl && !REGEX.test(finalUrl)) {
        throw new Error(Errors.Regex(finalUrl));
      }
      return baseUrl + finalUrl;
    };
  }
}

/**
 * @private
 * @see setupPathsHelper
 *
 * Initialize the function which setups up the url params
 */
function insertPathParams(
  fullUrl: string,
  segmentArr: string[],
  pathUrlVarCount: number,
  pathValues?: PathValues,
): string {
  // Validate
  if (pathValues === undefined) {
    return fullUrl;
  } else if (pathUrlVarCount != Object.keys(pathValues).length) {
    throw new Error(Errors.KeyNameLength(fullUrl));
  }
  // Setup the URL to return
  let retVal = '';
  for (const segment of segmentArr) {
    if (segment.startsWith(':')) {
      const key = segment.slice(1);
      if (!(key in pathValues)) {
        const message = Errors.KeyMissing(key);
        throw new Error(message);
      }
      retVal += '/' + String(pathValues[key]);
    } else {
      retVal += '/' + segment;
    }
  }
  // Return
  return retVal;
}

/**
 * @private
 * @see setupPathsHelper
 *
 * Append query params from an object to an existing URL string. Works with
 * absolute URLs and relative URLs in Node.js 24.
 */
function setupSearchParams(searchValues?: SearchValues): string {
  // Validate
  if (searchValues === undefined) {
    return '';
  }
  // Setup the URL to return
  let retVal = '';
  for (const searchParam in searchValues) {
    const value = searchValues[searchParam];
    if (typeof value === 'object') {
      retVal += `&${searchParam}=${JSON.stringify(value)}`;
    } else {
      retVal += `&${searchParam}=${value}`;
    }
  }
  // Return
  return !!retVal ? '?' + retVal.slice(1) : '';
}

/******************************************************************************
                                  Export
******************************************************************************/

export default setupPaths;
