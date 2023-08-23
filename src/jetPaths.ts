
/**
 * Convert paths to full paths.
 */


// **** Variables **** //

const DEFAULT_BASE_KEY = 'Base';



// **** Functions **** //

function jetPaths<T extends Record<string, string | object>>(pathObj: T, baseKey?: string): T {
  return jetPathsHelper(pathObj, baseKey ?? DEFAULT_BASE_KEY, '') as T;
}

/**
 * The recursive function.
 */
function jetPathsHelper(
  parentObj: Record<string, string | object>,
  baseKey: string,
  baseUrl: string,
): Record<string, string | object> {
  // Init vars
  const url = (baseUrl + parentObj[baseKey]),
    keys = Object.keys(parentObj),
    retVal: Record<string, string | object> = { [baseKey]: url };
  // Iterate keys
  for (const key of keys) {
    const pval = parentObj[key];
    if (key !== baseKey && typeof pval === 'string') {
      retVal[key] = (url + pval);
    } else if (typeof pval === 'object') {
      retVal[key] = jetPathsHelper(pval as {}, baseKey, url);
    }
  }
  // Return
  return retVal;
}


// **** Export default **** //

export default jetPaths;
