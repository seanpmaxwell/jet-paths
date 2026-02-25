import { BASE_KEY, DEFAULT_REGEX, Errors } from './constants';
import type {
  ArgObj,
  IOptions,
  PlainDataObject,
  RetVal,
  URLParams,
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
    strictKeyNames = options?.strictKeyNames ?? true,
    regex = getRegex(options);
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
 * Setup the regulat expression
 */
function getRegex(options?: IOptions): RegExp | false {
  if (options?.regex === undefined || options?.regex === true) {
    return DEFAULT_REGEX;
  } else if (options?.regex === false) {
    return false;
  } else if (options?.regex instanceof RegExp) {
    return options.regex;
  } else {
    return DEFAULT_REGEX;
  }
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
  regex: RegExp | false,
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
      runRegexTest(fullURL, regex);
      if (fullURL.includes('/:') || fullURL.includes('?')) {
        retVal[key] = setupFormatURLFn(fullURL, strictKeyNames);
      } else {
        retVal[key] = fullURL;
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
 * Run regular expression test
 */
function runRegexTest(fullURL: string, regex: RegExp | false): void {
  if (regex === false) return;
  if (!regex.test(fullURL)) {
    throw new Error(Errors.REGEX);
  }
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

  // pick up here, don't forget to prepent '/' at the very start
  console.log();

  if (pathParamIndexes.length > 0 && searchParamArr.length > 0) {
    return (pathParams: URLParams, searchParams: PlainDataObject): string => {
      let finalUrl = insertPathParams(
        strictKeyNames,
        pathUrlArr,
        pathParamIndexes,
        pathParams,
      );
      finalUrl = insertSearchParams(finalUrl);
    };
  } else if (pathParamIndexes.length > 0) {
  }

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
function insertPathParams(
  strictKeyNames: boolean,
  pathUrlArr: string[],
  pathParamIndexes: number[],
  valuesObj: URLParams,
): string {
  if (valuesObj === undefined) return '';
  // Check the number of keys
  const isParamObject = !!valuesObj && typeof valuesObj === 'object';
  if (strictKeyNames && isParamObject) {
    if (Object.keys(valuesObj).length !== pathParamIndexes.length) {
      throw new Error(Errors.STRICT_KEY_NAME_LENGTH);
    }
  }
  // Setup the URL to return
  const urlArrClone = [...pathUrlArr];
  pathParamIndexes.forEach((index) => {
    const key = urlArrClone[index];
    if (isParamObject) {
      if (strictKeyNames && !(key in valuesObj)) {
        throw new Error(Errors.StrictKeyName(key));
      }
      urlArrClone[index] = String(valuesObj[key]);
    } else if (valuesObj !== undefined) {
      urlArrClone[index] = String(valuesObj);
    }
  });
  // Return
  return urlArrClone.join('/');

  // Check the regex if truthy
  // const finalUrl = (path.startsWith('/') ? '/' : '') + urlArrClone.join('/');
  // if (!stripQueryAndHash(finalUrl, regex)) {
  //   throw new Error(Errors.REGEX);
  // }
  // return finalUrl;
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
  valuesObj: PlainDataObject,
): string {
  // const url = new URL(urlStr.slice(0, -2), APPEND_QUERY_PARAMS_BASE);
  // for (const [key, value] of Object.entries(params)) {
  //   if (value instanceof Date) {
  //     url.searchParams.append(key, value.toISOString());
  //   } else if (typeof value === 'object') {
  //     url.searchParams.append(key, JSON.stringify(value));
  //   } else {
  //     url.searchParams.append(key, String(value));
  //   }
  // }
  // return url.toString().slice(APPEND_QUERY_PARAMS_BASE.length);
  // pick up here, setup the search string
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
  const regex = options?.regex
    ? options.regex === true
      ? DEFAULT_REGEX
      : options.regex
    : null;
  return setupFormatURLFn(path, strictKeyNames, regex);
}

/******************************************************************************
                                  Export
******************************************************************************/

export default setupPaths;
