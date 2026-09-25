import Errors from './constants/Errors.js';
import { BASE_KEY, ROOT_KEY_PATH } from './constants/misc.js';
import { PARAM_REGEX, TEMPLATE_REGEX } from './constants/regexes.js';
import type { ArgObj, IOptions, Primitive } from './types/misc.js';
import type { ResolvePathsObject } from './types/ResolvePathsObject.js';

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
function setupPaths<
  const T extends ArgObj,
  const U extends IOptions | undefined,
>(pathObj: T, options?: U): ResolvePathsObject<T, U> {
  const settings: ISettings = {
    prepend: options?.prepend ?? '',
    validate: !options?.disableRegex,
  };
  // The runtime shape can't be proven to match the recursive public type
  const retVal = setupNode(pathObj, settings, '', []);
  return retVal as unknown as ResolvePathsObject<T, U>;
}

/**
 * The recursive function. Sets up the function for an object and attaches
 * its children as properties.
 *
 * Used by: {@link setupPaths}
 *
 * @private
 */
function setupNode(
  node: unknown,
  settings: ISettings,
  parentUrl: string,
  keyPath: string[],
): PathFunction {
  // Validate
  if (!isPlainObject(node)) {
    throw Errors.RouteValue(formatKeyPath(keyPath));
  }
  const baseUrl = node[BASE_KEY];
  if (typeof baseUrl !== 'string') {
    throw Errors.BaseKey(formatKeyPath(keyPath));
  }
  // Init vars
  const localBaseUrl = parentUrl + baseUrl,
    retVal = setupPathFn(baseUrl, localBaseUrl, settings, keyPath, true);
  // Iterate keys
  for (const [key, value] of Object.entries(node)) {
    if (key === BASE_KEY) {
      continue;
    }
    const childKeyPath = [...keyPath, key];
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
  keyPath: string[],
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
    retVal = (searchValues?: unknown) =>
      prepend + fullUrl + setupSearchParams(searchValues);
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
  keyPath: string[],
  isBaseKey: boolean,
): void {
  const errorKeyPath = formatKeyPath(
    isBaseKey ? [...keyPath, BASE_KEY] : keyPath,
  );
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

/**
 * Format the key path for error messages (i.e. "Users.One"). An empty key
 * path is the root object.
 *
 * Used by: {@link setupNode}, {@link validateTemplate}
 *
 * @private
 */
function formatKeyPath(keyPath: string[]): string {
  return keyPath.length > 0 ? keyPath.join('.') : ROOT_KEY_PATH;
}

/**
 * Use "defineProperty" so keys which collide with built-in function
 * properties (i.e. "name", "length") can still be set.
 *
 * Used by: {@link setupNode}, {@link setupPathFn}
 *
 * @private
 */
function addProperty(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    writable: false,
    configurable: false,
  });
}

/**
 * Check if a value is one of the primitives allowed for path and search
 * values. Functions, symbols, and bigints are rejected so they aren't
 * stringified into the url.
 *
 * Used by: {@link encodePathValue}, {@link setupSearchParams}
 *
 * @private
 */
function isPrimitive(value: unknown): value is Primitive {
  const type = typeof value;
  return (
    value === null ||
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'undefined'
  );
}

/**
 * Check if a value can be a nested route object. Arrays are rejected even
 * though their "typeof" is "object".
 *
 * Used by: {@link setupNode}
 *
 * @private
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default setupPaths;
