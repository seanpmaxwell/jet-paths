import { BASE_KEY, Errors, REGEX } from './constants.js';
import type { ArgObj, Dict, IOptions, RetVal } from './types.js';

/******************************************************************************
                                  Functions
******************************************************************************/

/**
 * Format path object.
 */
function setupPaths<
  const T extends ArgObj,
  const U extends IOptions | undefined,
>(pathObj: T, options?: U): RetVal<T, U> {
  const prepend = options?.prepend ?? '',
    disableRegex = !!options?.disableRegex;
  return setupPathsHelper(pathObj, prepend, '', 'root', disableRegex) as any;
}

/**
 * @private
 * @see setupPaths
 *
 * The recursive function.
 */
function setupPathsHelper(
  parentObj: Record<string, string | ArgObj>,
  prepend: string,
  parentUrl: string,
  parentName: string,
  disableRegex: boolean,
): Record<string, unknown> {
  // Validate base key
  const baseUrl = parentObj[BASE_KEY];
  if (typeof baseUrl !== 'string') {
    throw new Error(Errors.BaseKey(parentName));
  }
  // Init vars
  const localBaseUrl = parentUrl + baseUrl,
    keys = Object.keys(parentObj),
    retVal = setupFormatURLFn(prepend, localBaseUrl, baseUrl, disableRegex);
  // Iterate keys
  for (const key of keys) {
    const pathItem = parentObj[key];
    if (key === BASE_KEY) {
      continue;
    } else if (typeof pathItem === 'string') {
      const fullUrl = localBaseUrl + pathItem;
      addProperty(
        retVal,
        key,
        setupFormatURLFn(prepend, fullUrl, pathItem, disableRegex),
      );
    } else if (typeof pathItem === 'object') {
      addProperty(
        retVal,
        key,
        setupPathsHelper(pathItem, prepend, localBaseUrl, key, disableRegex),
      );
    }
  }
  // Return
  return retVal;
}

/**
 * @private
 * @see setupPathsHelper
 *
 * Use "defineProperty" so keys which collide with built-in function
 * properties (i.e. "name", "length") can still be set.
 */
function addProperty(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    writable: false,
    configurable: false,
  });
}

/**
 * @private
 * @see setupPathsHelper
 *
 * Initialize the function which returns the full url. The function also has
 * a "_" property which is the original unformatted partial path.
 */
function setupFormatURLFn(
  prepend: string,
  fullUrl: string,
  partialUrl: string,
  disableRegex: boolean,
): Record<string, unknown> {
  const retVal = setupFormatURLFnHelper(prepend, fullUrl, disableRegex);
  addProperty(retVal, BASE_KEY, partialUrl);
  return retVal as unknown as Record<string, unknown>;
}

/**
 * @private
 * @see setupFormatURLFn
 *
 * Create the function which returns the full url.
 */
function setupFormatURLFnHelper(
  prepend: string,
  fullUrl: string,
  disableRegex: boolean,
) {
  const segmentArr = fullUrl.split('/').filter(Boolean),
    pathVarCount = segmentArr.filter((p) => p.startsWith(':')).length;
  // Return function to insert pathValues
  if (pathVarCount > 0) {
    return (pathValues?: object, searchValues?: object): string => {
      let finalUrl = insertPathParams(
        fullUrl,
        segmentArr,
        pathVarCount,
        pathValues,
      );
      finalUrl += setupSearchParams(searchValues);
      if (!disableRegex && !!pathValues && !REGEX.test(finalUrl)) {
        throw new Error(Errors.Regex(finalUrl));
      }
      return prepend + finalUrl;
    };
    // Return function only insert search values
  } else {
    return (searchValues?: object): string => {
      const finalUrl = fullUrl + setupSearchParams(searchValues);
      if (!disableRegex && !REGEX.test(finalUrl)) {
        throw new Error(Errors.Regex(finalUrl));
      }
      return prepend + finalUrl;
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
  pathValues?: object,
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
      retVal += '/' + String((pathValues as Dict)[key]);
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
function setupSearchParams(searchValues?: object): string {
  // Validate
  if (searchValues === undefined) {
    return '';
  }
  // Setup the URL to return
  let retVal = '';
  for (const searchParam in searchValues) {
    const value = (searchValues as Dict)[searchParam];
    if (!!value && typeof value === 'object') {
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
