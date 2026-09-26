import { PARAM_REGEX } from '@cmn/constants/regexes';
import { addProperty, isPlainObject, isPrimitive } from '@cmn/fns/misc';

import Errors from './_local/constants/Errors';
import { BASE_KEY, ROOT_KEY_PATH } from './_local/constants/misc';
import { TEMPLATE_REGEX } from './_local/constants/regexes';
import type { JetPathsOptions, JetPathsParamObject } from './_local/types/misc';
import type { ResolveJetPathsObject } from './_local/types/ResolveJetPathsObject';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

interface ISettings {
  prepend: string;
  validate: boolean;
}

// Runtime shape of every node. "ResolvePathsObject" is the public type.
type PathFunction = ((...args: unknown[]) => string) & {
  readonly _: string;
};

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Format path object.
 */
function jetPaths<
  const T extends JetPathsParamObject,
  const U extends JetPathsOptions | undefined,
>(pathObj: T, options?: U): ResolveJetPathsObject<T, U> {
  const settings: ISettings = {
    prepend: options?.prepend ?? '',
    validate: !options?.disableRegex,
  };
  // The runtime shape can't be proven to match the recursive public type
  const retVal = setupNode(pathObj, settings, '');
  return retVal as unknown as ResolveJetPathsObject<T, U>;
}

/**
 * The recursive function. Sets up the function for an object and attaches
 * its children as properties.
 *
 * Used by: {@link jetPaths}
 *
 * @private
 */
function setupNode(
  node: unknown,
  settings: ISettings,
  parentUrl: string,
  keyPath?: string,
): PathFunction {
  // Validate
  if (!isPlainObject(node)) {
    throw Errors.RouteValue(keyPath ?? ROOT_KEY_PATH);
  }
  const baseUrl = node[BASE_KEY];
  if (typeof baseUrl !== 'string') {
    throw Errors.BaseKey(keyPath ?? ROOT_KEY_PATH);
  }
  // Init vars
  const localBaseUrl = parentUrl + baseUrl,
    retVal = setupPathFn(baseUrl, localBaseUrl, settings, keyPath, true);
  // Iterate keys
  for (const [key, value] of Object.entries(node)) {
    if (key === BASE_KEY) {
      continue;
    }
    const childKeyPath = keyPath === undefined ? key : `${keyPath}.${key}`;
    const child =
      typeof value === 'string'
        ? setupPathFn(
            value,
            localBaseUrl + value,
            settings,
            childKeyPath,
            false,
          )
        : setupNode(value, settings, localBaseUrl, childKeyPath);
    addProperty(retVal, key, child);
  }
  // Return
  return retVal;
}

/**
 * Initialize the function which returns the full url. The function also has
 * a "_" property which is the original unformatted partial path.
 *
 * Used by: {@link setupNode}
 *
 * @private
 */
function setupPathFn(
  partialUrl: string,
  fullUrl: string,
  settings: ISettings,
  keyPath: string | undefined,
  isBaseKey: boolean,
): PathFunction {
  if (settings.validate) {
    validateTemplate(partialUrl, fullUrl, keyPath, isBaseKey);
  }
  const { prepend } = settings,
    paramNames = [
      ...new Set(Array.from(fullUrl.matchAll(PARAM_REGEX), (m) => m[1])),
    ];
  // Setup the function
  let retVal: (...args: unknown[]) => string;
  if (paramNames.length > 0) {
    retVal = (pathValues?: unknown, searchValues?: unknown) =>
      prepend +
      insertPathParams(fullUrl, paramNames, pathValues) +
      setupSearchParams(searchValues);
  } else {
    const url = prepend + fullUrl;
    retVal = (searchValues?: unknown) => url + setupSearchParams(searchValues);
  }
  // Return
  addProperty(retVal, BASE_KEY, partialUrl);
  return retVal as PathFunction;
}

/**
 * Check the partial and full url templates once, at setup time.
 *
 * Used by: {@link setupPathFn}
 *
 * @private
 */
function validateTemplate(
  partialUrl: string,
  fullUrl: string,
  keyPath: string | undefined,
  isBaseKey: boolean,
): void {
  const errorKeyPath = isBaseKey
    ? keyPath === undefined
      ? BASE_KEY
      : `${keyPath}.${BASE_KEY}`
    : (keyPath ?? ROOT_KEY_PATH);
  // Only base keys may be empty, everything else must start with a "/"
  if (!isBaseKey && !partialUrl.startsWith('/')) {
    throw Errors.Template(errorKeyPath, partialUrl);
  } else if (!TEMPLATE_REGEX.test(partialUrl)) {
    throw Errors.Template(errorKeyPath, partialUrl);
  } else if (!TEMPLATE_REGEX.test(fullUrl)) {
    throw Errors.Template(errorKeyPath, fullUrl);
  }
}

/**
 * Insert the path values into the url. Returns the template unchanged if
 * no path values were passed.
 *
 * Used by: {@link setupPathFn}
 *
 * @private
 */
function insertPathParams(
  fullUrl: string,
  paramNames: string[],
  pathValues: unknown,
): string {
  // Validate
  if (pathValues === undefined) {
    return fullUrl;
  } else if (typeof pathValues !== 'object' || pathValues === null) {
    throw Errors.PathParamsType(fullUrl);
  } else if (paramNames.length !== Object.keys(pathValues).length) {
    throw Errors.KeyNameLength(fullUrl);
  }
  for (const name of paramNames) {
    if (!Object.hasOwn(pathValues, name)) {
      throw Errors.KeyMissing(name);
    }
  }
  // Replace params in place so the rest of the url is left untouched
  const values = pathValues as Record<string, unknown>;
  return fullUrl.replace(
    PARAM_REGEX,
    (_, name: string) => '/' + encodePathValue(name, values[name]),
  );
}

/**
 * Encode a single path value. Values that would change the structure of the
 * url (i.e. "", ".", "..") are rejected.
 *
 * Used by: {@link insertPathParams}
 *
 * @private
 */
function encodePathValue(key: string, value: unknown): string {
  if (!isPrimitive(value)) {
    throw Errors.PathValue(key);
  }
  const str = String(value);
  if (str === '' || str === '.' || str === '..') {
    throw Errors.PathValue(key);
  }
  return encodeURIComponent(str);
}

/**
 * Setup the query string from an object. Arrays become repeated keys and
 * "undefined" values are skipped.
 *
 * Used by: {@link setupPathFn}
 *
 * @private
 */
function setupSearchParams(searchValues: unknown): string {
  // Validate
  if (searchValues === undefined) {
    return '';
  } else if (typeof searchValues !== 'object' || searchValues === null) {
    throw Errors.SearchParamsType();
  }
  // Setup the query string
  const parts: string[] = [];
  for (const [key, value] of Object.entries(searchValues)) {
    const items: unknown[] = Array.isArray(value) ? value : [value];
    for (const item of items) {
      if (item === undefined) {
        continue;
      } else if (!isPrimitive(item)) {
        throw Errors.SearchValue(key);
      }
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`,
      );
    }
  }
  // Return
  return parts.length > 0 ? '?' + parts.join('&') : '';
}

// ================================ Helpers ================================ //

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default jetPaths;
