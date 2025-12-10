// **** Constants **** //

const DEFAULT_BASE_KEY = 'Root';


// **** Types **** //

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


// **** Functions **** //

/**
 * Format path object.
 */
function setupPaths<const T extends TObject, BK extends keyof T = typeof DEFAULT_BASE_KEY>(
  pathObj: T,
  baseKey?: BK,
): ExpandPaths<T, BK, BK extends keyof T ? T[BK] extends string ? T[BK] : never : never> {
  return setupPathsHelper(pathObj, (baseKey ?? DEFAULT_BASE_KEY), '');
}

/**
 * The recursive function.
 */
function setupPathsHelper<const T extends TObject>(
  parentObj: TObject,
  baseKey: keyof T,
  baseUrl: string,
): T {
  // Init vars
  const url = (baseUrl + (parentObj[baseKey] as string)),
    keys = Object.keys(parentObj),
    retVal: any = { [baseKey]: url };
  // Iterate keys
  for (const key of keys) {
    const pval = parentObj[key];
    if (key !== baseKey && typeof pval === 'string') {
      retVal[key] = (url + pval);
    } else if (typeof pval === 'object') {
      retVal[key] = setupPathsHelper(pval, baseKey, url);
    }
  }
  // Return
  return retVal;
}


// **** Export default **** //

export default setupPaths;
