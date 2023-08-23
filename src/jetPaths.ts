
/**
 * Convert paths to full paths.
 */


// **** Variables **** //

const DEFAULT_BASE_KEY = 'Base';



// **** Functions **** //

function jetPaths<T>(pathObj: T, baseKey?: string): T {
  return jetPathsHelper(pathObj, baseKey ?? DEFAULT_BASE_KEY, '');
}

/**
 * The recursive function.
 */
function jetPathsHelper(
  parentObj: any,
  baseKey: string,
  baseUrl: string,
): any {
  // Init vars
  const url = (baseUrl + parentObj[baseKey]),
    keys = Object.keys(parentObj),
    retVal = { [baseKey]: url };
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
