
/**
 * Convert paths to full paths.
 */


// **** Variables **** //

const DEFAULT_BASE_KEY = 'Base';


// **** Types **** //

type TObj = { 
  [key: string]: string | TObj 
};

// If an 'as const' is passed need to convert string 
// specific vals back to just basic 'string' values.
type Deep<T extends TObj | string> = 
  T extends string
    ? string 
    : T extends TObj
      ? { [K in keyof T]: Deep<T[K]> }
      : unknown

// **** Functions **** //

/**
 * Format path object.
 */
function setupPaths<T extends TObj>(pathObj: T, baseKey?: string): Deep<T> {
  return setupPathsHelper(pathObj, (baseKey ?? DEFAULT_BASE_KEY), '');
}

/**
 * The recursive function.
 */
function setupPathsHelper<T extends TObj>(
  parentObj: TObj,
  baseKey: string,
  baseUrl: string,
): T {
  // Init vars
  const url = (baseUrl + parentObj[baseKey]),
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
