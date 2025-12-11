// **** Constants **** //

const DEFAULT_BASE_KEY = 'Root';


// **** Types **** //

export type TUrlParamValue = string | number | boolean | null | undefined;
export type TUrlParamArg = Record<string, TUrlParamValue>;

type TObject = { 
  [key: string]: string | TObject 
};

/**
 * Joins two path segments, handling slashes cleanly.
 */
type Join<A extends string, B extends string> =
  A extends "" ? B :
  B extends "" ? A :
  `${A}${B}`;

/**
 * Recursively prefix all string paths in an object
 */
type ExpandPaths<T extends Record<string, any>, BK extends keyof T, Prefix extends string> = {
  [K in keyof T]: 
    T[K] extends string
      ? Join<Prefix, T[K]>
      : T[K] extends Record<string, any>
        ? ExpandPaths<T[K], BK, Join<Prefix, T[K][BK]>>
        : never;
};

type Iterate<T extends TObject> = { 
  [K in keyof T]: T[K] extends string ? ResolveType<T[K]> : T[K] extends object ? Iterate<T[K]> : never
};

type ResolveType<S extends string> =
  S extends `${string}/:${string}`
    ? (urlParams?: TUrlParamArg) => S
    : S;


// **** Functions **** //

/**
 * Format path object.
 */
function setupPaths<
  const T extends TObject,
  BK extends keyof T = typeof DEFAULT_BASE_KEY,
  Prefix extends string = (BK extends keyof T ? T[BK] extends string ? T[BK] : never : never),
>(
  pathObj: T,
  baseKey?: BK,
): Iterate<ExpandPaths<T, BK, Prefix>> {
  return setupPathsHelper<T>(pathObj, (baseKey ?? DEFAULT_BASE_KEY), '') as Iterate<ExpandPaths<T, BK, Prefix>>;
}

/**
 * The recursive function.
 */
function setupPathsHelper<T extends TObject>(
  parentObj: TObject,
  baseKey: keyof T,
  baseUrl: string,
): Record<string, unknown> {
  // Init vars
  const url = (baseUrl + (parentObj[baseKey] as string)),
    keys = Object.keys(parentObj),
    retVal: any = { [baseKey]: url };
  // Iterate keys
  for (const key of keys) {
    const pval = parentObj[key];
    if (key !== baseKey && typeof pval === 'string') {
      const finalUrl = (url + pval);
      if (pval.includes('/:')) {
        retVal[key] = setupInsertUrlParamsFn(finalUrl);
      } else {
        retVal[key] = finalUrl; 
      }
    } else if (typeof pval === 'object') {
      retVal[key] = setupPathsHelper(pval, baseKey, url);
    }
  }
  // Return
  return retVal;
}

/**
 * Initialize the function which setups up the url params
 */
function setupInsertUrlParamsFn(path: string) {
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


// **** Export default **** //

export default setupPaths;
