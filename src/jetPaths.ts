
/**
 * Convert paths to full paths.
 */


// **** Variables **** //

const DEFAULT_BASE_KEY = 'Base';


// **** Types **** //

interface IPathObj {
  [key: string]: string | IPathObj;
}


// **** Functions **** //

function jetPaths(pathObj: IPathObj, baseKey?: string): IPathObj {
  return jetPathsHelper(pathObj, baseKey ?? DEFAULT_BASE_KEY, '');
}

/**
 * The recursive function.
 */
function jetPathsHelper(
  parentObj: IPathObj,
  baseKey: string,
  baseUrl: string,
): IPathObj {
  // Init vars
  const url = (baseUrl + parentObj[baseKey]),
    keys = Object.keys(parentObj),
    retVal: IPathObj = { [baseKey]: url };
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
