import {
  BASE_KEY,
  Errors,
  REGEX_PATHNAME,
  REGEX_SEARCH_QUERY,
} from './constants';
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
    if (typeof pathItem === 'string') {
      if (!pathItem.startsWith('/')) {
        throw new Error(Errors.ForwardSlash(key, parentUrl));
      }
      if (key !== BASE_KEY) {
        const fullUrl = localBaseUrl + pathItem;
        if (fullUrl.includes('/:') || fullUrl.includes('?')) {
          retVal[key] = setupFormatURLFn(baseUrl, fullUrl);
        } else {
          retVal[key] = baseUrl + fullUrl;
        }
      }
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
  // Init
  const fullUrlArr = fullUrl.split('?').filter(Boolean),
    [pathUrl, searchUrl] = fullUrlArr,
    segmentArr = pathUrl.split('/').filter(Boolean),
    pathVarCount = segmentArr.filter((p) => p.startsWith(':')).length;
  // Get a list of the searchParams
  const searchParamArr: string[] =
    searchUrl?.split('&').map((pair) => pair.split('=')[0]) ?? '';
  // Setup the `getFinalUrl` function
  const getFinalUrl = configureGetFinalUrlFn(
    baseUrl,
    fullUrl,
    segmentArr,
    pathVarCount,
    searchParamArr,
  );
  // Return the user facing function
  if (pathVarCount > 0 && searchParamArr.length > 0) {
    return (pathValues?: PathValues, searchValues?: SearchValues): string =>
      getFinalUrl(pathValues, searchValues);
  } else if (pathVarCount > 0) {
    return (pathValues?: PathValues) => getFinalUrl(pathValues);
  } else if (searchParamArr.length > 0) {
    return (searchValues?: SearchValues) =>
      getFinalUrl(undefined, searchValues);
  } else {
    return () => getFinalUrl();
  }
}

/**
 * @private
 * @see setupFormatURLFn
 *
 * Return a function which combines the pathURL and the search-query string.
 */
function configureGetFinalUrlFn(
  baseUrl: string,
  fullUrl: string,
  segmentArr: string[],
  pathUrlVarCount: number,
  searchParamArr: string[],
): (pathValues?: PathValues, searchValues?: SearchValues) => string {
  return (pathValues?: PathValues, searchValues?: SearchValues): string => {
    let finalUrl = insertPathParams(
      fullUrl,
      segmentArr,
      pathUrlVarCount,
      pathValues,
    );
    finalUrl += insertSearchParams(finalUrl, searchParamArr, searchValues);
    return baseUrl + (finalUrl || fullUrl);
  };
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
    return '/' + segmentArr.join('/');
  } else if (pathUrlVarCount != Object.keys(pathValues).length) {
    throw new Error(Errors.KeyNameLength(fullUrl));
  }
  // Setup the URL to return
  let retVal = '';
  segmentArr.forEach((segment) => {
    if (!segment.startsWith(':')) {
      return (retVal += '/' + segment);
    }
    const key = segment.slice(1);
    if (!(key in pathValues)) {
      const message = Errors.KeyMissing(key);
      throw new Error(message);
    }
    retVal += '/' + String(pathValues[key]);
  });
  // Validate and return
  if (!!pathValues && !REGEX_PATHNAME.test(retVal)) {
    throw new Error(Errors.RegexPath(retVal));
  }
  return retVal;
}

/**
 * @private
 * @see setupPathsHelper
 *
 * Append query params from an object to an existing URL string. Works with
 * absolute URLs and relative URLs in Node.js 24.
 */
function insertSearchParams(
  fullUrl: string,
  searchParamArr: string[],
  searchValues?: SearchValues,
): string {
  // Validate
  if (searchValues === undefined) {
    return '';
  } else if (Object.keys(searchValues).length !== searchParamArr.length) {
    throw new Error(Errors.KeyNameLength(fullUrl));
  }
  // Setup the URL to return
  let retVal = '';
  searchParamArr.forEach((searchParam, i) => {
    if (!(searchParam in searchValues)) {
      const message = Errors.KeyMissing(searchParam);
      throw new Error(message);
    }
    const value = searchValues[searchParam];
    if (typeof value === 'object') {
      retVal += `&${searchParam}=${JSON.stringify(value)}`;
    } else {
      retVal += `&${searchParam}=${value}`;
    }
  });
  retVal = !!retVal ? '?' + retVal.slice(1) : '';
  // Validate and return
  if (searchValues && !REGEX_SEARCH_QUERY.test(retVal)) {
    throw new Error(Errors.RegexPath(retVal));
  }
  return retVal;
}

// ------------------------ Independent Functions -------------------------- //

/**
 * Initialize the function which setups up the url params
 */
export function setupExternalFormatURLFn(path: string) {
  if (!path.startsWith('/')) {
    throw new Error(Errors.ForwardSlash(path));
  }
  return setupFormatURLFn('', path);
}

/******************************************************************************
                                  Export
******************************************************************************/

export default setupPaths;
