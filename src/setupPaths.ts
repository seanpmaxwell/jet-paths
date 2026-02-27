import { BASE_KEY, Errors, REGEX_FORMATTED, REGEX_INCOMING } from './constants';
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
  // Setup baseUrl/keynames
  const baseUrl = options?.prepend ?? '',
    strictKeyNames = options?.strictKeyNames ?? true;
  // Return
  return setupPathsHelper(pathObj, baseUrl, '', strictKeyNames, 'root') as any;
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
  strictKeyNames: boolean,
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
    const pval = parentObj[key];
    if (key !== BASE_KEY && typeof pval === 'string') {
      const fullUrl = localBaseUrl + pval;
      if (fullUrl.includes('/:') || fullUrl.includes('?')) {
        retVal[key] = setupFormatURLFn(baseUrl, fullUrl, strictKeyNames);
      } else {
        if (!REGEX_FORMATTED.test(fullUrl)) {
          throw new Error(Errors.REGEX);
        }
        retVal[key] = baseUrl + fullUrl;
      }
    } else if (typeof pval === 'object') {
      retVal[key] = setupPathsHelper(
        pval,
        baseUrl,
        localBaseUrl,
        strictKeyNames,
        key,
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
 * Initialize the function which setups up the url params
 */
function setupFormatURLFn(
  baseUrl: string,
  fullUrl: string,
  strictKeyNames = true,
) {
  // Test format
  console.log('horse', fullUrl);
  if (!REGEX_INCOMING.test(fullUrl)) {
    throw new Error(Errors.REGEX);
  }
  // init
  const fullUrlArr = fullUrl.split('?').filter(Boolean),
    [pathUrl, searchUrl] = fullUrlArr;
  // Get the indexes where a variable exists
  const pathUrlArr = pathUrl.split('/').filter(Boolean),
    pathParamIndexes: number[] = [];
  pathUrlArr.forEach((param, i) => {
    if (param.startsWith(':')) {
      pathParamIndexes.push(i);
      pathUrlArr[i] = pathUrlArr[i].slice(1);
    }
  });
  // Get a list of the searchParams
  const searchParamArr: string[] =
    searchUrl?.split('&').map((pair) => pair.split('=')[0]) ?? '';
  // Setup the `getFinalUrl` function
  const getFinalUrl = configureGetFinalUrlFn(
    baseUrl,
    fullUrl,
    strictKeyNames,
    pathUrlArr,
    pathParamIndexes,
    searchParamArr,
  );
  // Return the user facing function
  if (pathParamIndexes.length > 0 && searchParamArr.length > 0) {
    return (pathValues?: PathValues, searchValues?: SearchValues): string =>
      getFinalUrl(pathValues, searchValues);
  } else if (pathParamIndexes.length > 0) {
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
  origUrl: string,
  strictKeyNames: boolean,
  pathUrlArr: string[],
  pathParamIndexes: number[],
  searchParamArr: string[],
): (pathValues?: PathValues, searchValues?: SearchValues) => string {
  return (pathValues?: PathValues, searchValues?: SearchValues): string => {
    let finalUrl = '';
    // Insert path values
    if (pathValues) {
      const finalPathUrl = insertPathParams(
        strictKeyNames,
        pathUrlArr,
        pathParamIndexes,
        pathValues,
      );
      finalUrl += '/' + finalPathUrl;
    }
    // Insert search params
    if (searchValues) {
      const finalSearchUrl = insertSearchParams(
        searchParamArr,
        searchValues,
        strictKeyNames,
      );
      finalUrl += '?' + finalSearchUrl;
    }
    // Finish
    if (!finalUrl) {
      return baseUrl + origUrl;
    } else if (!REGEX_FORMATTED.test(finalUrl)) {
      throw new Error(Errors.REGEX);
    }
    return baseUrl + finalUrl;
  };
}

/**
 * @private
 * @see setupPathsHelper
 *
 * Initialize the function which setups up the url params
 */
function insertPathParams(
  strictKeyNames: boolean,
  pathUrlArr: string[],
  pathParamIndexes: number[],
  pathValues?: PathValues,
): string {
  // Validate
  if (pathValues === undefined) {
    return '';
  } else if (
    strictKeyNames &&
    Object.keys(pathValues).length !== pathParamIndexes.length
  ) {
    throw new Error(Errors.STRICT_KEY_NAME_LENGTH);
  }
  // Setup the URL to return
  const urlArrClone = [...pathUrlArr];
  pathParamIndexes.forEach((index) => {
    const key = urlArrClone[index];
    if (strictKeyNames && !(key in pathValues)) {
      const message = Errors.StrictKeyName(key);
      throw new Error(message);
    }
    urlArrClone[index] = String(pathValues[key]);
  });
  // Return
  return urlArrClone.join('/');
}

/**
 * @private
 * @see setupPathsHelper
 *
 * Append query params from an object to an existing URL string. Works with
 * absolute URLs and relative URLs in Node.js 24.
 */
function insertSearchParams(
  searchParamArr: string[],
  searchValues?: SearchValues,
  strictKeyNames = false,
): string {
  // Validate
  if (searchValues === undefined) {
    return '';
  } else if (
    strictKeyNames &&
    Object.keys(searchValues).length !== searchParamArr.length
  ) {
    throw new Error(Errors.STRICT_KEY_NAME_LENGTH);
  }
  // Setup the URL to return
  let searchParamsStr = '';
  searchParamArr.forEach((searchParam, i) => {
    if (strictKeyNames && !(searchParam in searchValues)) {
      const message = Errors.StrictKeyName(searchParam);
      throw new Error(message);
    }
    const value = searchValues[searchParam];
    if (typeof value === 'object') {
      searchParamsStr += `&${searchParam}=${JSON.stringify(value)}`;
    } else {
      searchParamsStr += `&${searchParam}=${value}`;
    }
  });
  // Return
  return searchParamsStr.slice(1);
}

// ------------------------ Independent Functions -------------------------- //

/**
 * Initialize the function which setups up the url params
 */
export function setupExternalFormatURLFn(
  path: string,
  options?: Omit<IOptions, 'prepend'> | undefined,
) {
  const strictKeyNames = options?.strictKeyNames ?? true;
  return setupFormatURLFn('', path, strictKeyNames);
}

/******************************************************************************
                                  Export
******************************************************************************/

export default setupPaths;
