
/**
 * Convert paths to full paths.
 */


// **** Variables **** //

const DEFAULT_BASE_KEY = 'Base';


// **** Types **** //

type TObject = { 
  [key: string]: string | TObject 
};

// If an 'as const' is passed need to convert string 
// specific vals back to just basic 'string' values.
type Deep<T extends {}> = T extends string ? string : {
  [K in keyof T]: Deep<T[K]>
};


// **** Functions **** //

/**
 * Format path object.
 */
function jetPaths<T extends TObject>(pathObj: T, baseKey?: string): Deep<T> {
  return jetPathsHelper(pathObj, (baseKey ?? DEFAULT_BASE_KEY), '');
}

/**
 * The recursive function.
 */
function jetPathsHelper<T extends TObject>(
  parentObj: TObject,
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
      retVal[key] = jetPathsHelper(pval, baseKey, url);
    }
  }
  // Return
  return retVal;
}


// **** Export default **** //

export default jetPaths;
