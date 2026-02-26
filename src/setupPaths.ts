import { BASE_KEY, DEFAULT_REGEX, Errors } from './constants';
import type {
  ArgObj,
  IOptions,
  PathParams,
  RetVal,
  SearchParams,
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
  return setupPathsHelper(pathObj, baseUrl, strictKeyNames, 'root') as any;
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
      const fullURL = url + pval;
      if (!DEFAULT_REGEX.test(fullURL)) {
        throw new Error(Errors.REGEX);
      }
      if (fullURL.includes('/:') || fullURL.includes('?')) {
        retVal[key] = setupFormatURLFn(fullURL, strictKeyNames);
      } else {
        retVal[key] = fullURL;
      }
    } else if (typeof pval === 'object') {
      retVal[key] = setupPathsHelper(pval, url, strictKeyNames, key);
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
function setupFormatURLFn(fullURL: string, strictKeyNames = true) {
  const fullUrlArr = fullURL.split('?').filter(Boolean),
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
  const searchParamArr = searchUrl.split('&').map((pair) => pair.split('=')[0]);
  // Insert `PathParams` and `SearchParams`
  if (pathParamIndexes.length > 0 && searchParamArr.length > 0) {
    return (pathParams?: PathParams, searchParams?: SearchParams): string => {
      const finalPathUrl = insertPathParams(
        strictKeyNames,
        pathUrlArr,
        pathParamIndexes,
        pathParams,
      );
      const finalSearchUrl = insertSearchParams(
        searchParamArr,
        searchParams,
        strictKeyNames,
      );
      return finalPathUrl + finalSearchUrl;
    };
    // Insert `PathParams`
  } else if (pathParamIndexes.length > 0) {
    return (pathParams?: PathParams) =>
      insertPathParams(
        strictKeyNames,
        pathUrlArr,
        pathParamIndexes,
        pathParams,
      );
    // Insert `SearchParams`
  } else if (searchParamArr.length > 0) {
    return (searchParams?: SearchParams) =>
      insertSearchParams(searchParamArr, searchParams, strictKeyNames);
    // No `params`
  } else {
    return () => fullURL;
  }
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
  valuesObj?: PathParams,
): string {
  // Validate
  if (valuesObj === undefined) {
    return '';
  } else if (Object.keys(valuesObj).length !== pathParamIndexes.length) {
    throw new Error(Errors.STRICT_KEY_NAME_LENGTH);
  }
  // Setup the URL to return
  const urlArrClone = [...pathUrlArr];
  pathParamIndexes.forEach((index) => {
    const key = urlArrClone[index];
    if (strictKeyNames && !(key in valuesObj)) {
      const message = Errors.StrictKeyName(key);
      throw new Error(message);
    }
    urlArrClone[index] = String(valuesObj[key]);
  });
  // Return
  return '/' + urlArrClone.join('/');
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
  valuesObj?: SearchParams,
  strictKeyNames = false,
): string {
  // Validate
  if (valuesObj === undefined) {
    return '';
  } else if (Object.keys(valuesObj).length !== searchParamArr.length) {
    throw new Error(Errors.STRICT_KEY_NAME_LENGTH);
  }
  // Setup the URL to return
  let searchParamsStr = '';
  searchParamArr.forEach((searchParam, i) => {
    if (strictKeyNames && !(searchParam in valuesObj)) {
      const message = Errors.StrictKeyName(searchParam);
      throw new Error(message);
    }
    const value = valuesObj[searchParam];
    if (typeof value === 'object') {
      searchParamsStr += `&${searchParam}=${JSON.stringify(value)}`;
    } else {
      searchParamsStr += `&${searchParam}=${value}`;
    }
  });
  // Return
  return '?' + searchParamsStr.slice(1);
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
  return setupFormatURLFn(path, strictKeyNames);
}

/******************************************************************************
                                  Export
******************************************************************************/

export default setupPaths;
