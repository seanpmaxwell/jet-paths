import { PARAM_REGEX } from '@cmn/constants/regexes';
import { addProperty, isPlainObject, isPrimitive } from '@cmn/fns/misc';

import Errors from './_local/constants/Errors';
import { PATH_KEY, ROOT_KEY_PATH, TEMPLATE_KEY } from './_local/constants/misc';
import {
  SEARCH_KEY_REGEX,
  SEARCH_KEYS_REGEX,
  TEMPLATE_REGEX,
} from './_local/constants/regexes';
import type {
  JetPathsOptions,
  JetPathsParamObject,
  ValidateJetPathsObject,
} from './_local/types/misc';
import type { ResolveJetPathsObject } from './_local/types/ResolveJetPathsObject';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

interface ISettings {
  prepend: string;
  validate: boolean;
}

// Search keys declared on a route (i.e. "/search?<q!><page>").
interface ISearchKeys {
  allowed: Set<string>;
  required: string[];
}

// A url split around its path params once, at setup, so calls only join
// strings. "statics" is the text before, between, and after the params, so it
// has one more item than "names" (i.e. "/users/:id" is ["/users/", ""] and
// ["id"]).
interface IUrlTemplate {
  url: string;
  statics: string[];
  names: string[];
  unique: string[];
}

// Runtime shape of every node. "ResolvePathsObject" is the public type.
type PathFunction = ((...args: unknown[]) => string) & {
  readonly $path: string;
  readonly $tmpl?: string;
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
>(
  pathObj: T & ValidateJetPathsObject<T>,
  options: U,
): ResolveJetPathsObject<T, U>;
function jetPaths<const T extends JetPathsParamObject>(
  pathObj: T & ValidateJetPathsObject<T>,
): ResolveJetPathsObject<T, undefined>;
function jetPaths(
  pathObj: JetPathsParamObject,
  options?: JetPathsOptions,
): unknown {
  const settings: ISettings = {
    prepend: options?.prepend ?? '',
    validate: !options?.disableRegex,
  };
  return setupNode(pathObj, settings, '', new WeakSet());
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
  ancestors: WeakSet<object>,
  keyPath?: string,
): PathFunction {
  // Validate
  if (!isPlainObject(node)) {
    throw Errors.RouteValue(keyPath ?? ROOT_KEY_PATH);
  }
  if (ancestors.has(node)) {
    throw Errors.CircularRoute(keyPath ?? ROOT_KEY_PATH);
  }
  ancestors.add(node);
  const baseUrl = node[PATH_KEY];
  if (!Object.hasOwn(node, PATH_KEY) || typeof baseUrl !== 'string') {
    throw Errors.PathKey(keyPath ?? ROOT_KEY_PATH);
  }
  // Init vars
  const localBaseUrl = parentUrl + baseUrl,
    retVal = setupPathFn(baseUrl, localBaseUrl, settings, keyPath, true);
  // Iterate keys
  for (const [key, value] of Object.entries(node)) {
    if (key === PATH_KEY) {
      continue;
    }
    const childKeyPath = keyPath === undefined ? key : `${keyPath}.${key}`;
    if (key === TEMPLATE_KEY) {
      throw Errors.ReservedKey(childKeyPath);
    } else if (key === 'then') {
      throw Errors.ThenKey(childKeyPath);
    }
    const child =
      typeof value === 'string'
        ? setupRoute(value, localBaseUrl, settings, childKeyPath)
        : setupNode(value, settings, localBaseUrl, ancestors, childKeyPath);
    addProperty(retVal, key, child);
  }
  // Only ancestors are tracked: sharing a subtree between siblings is valid.
  ancestors.delete(node);
  // Return
  return retVal;
}

/**
 * Split a route into its path and the search keys declared after a "?" (i.e.
 * "/search?<q!><page>"), then setup its function. The declared keys aren't part
 * of the path.
 *
 * Used by: {@link setupNode}
 *
 * @private
 */
function setupRoute(
  route: string,
  parentUrl: string,
  settings: ISettings,
  keyPath: string,
): PathFunction {
  const index = route.indexOf('?');
  if (index === -1) {
    return setupPathFn(route, parentUrl + route, settings, keyPath, false);
  }
  const path = route.slice(0, index),
    searchKeys = parseSearchKeys(route, index + 1, settings, keyPath);
  return setupPathFn(
    path,
    parentUrl + path,
    settings,
    keyPath,
    false,
    searchKeys,
  );
}

/**
 * Parse the search keys declared after the "?" (i.e. "<q!><page>"). Keys are
 * optional unless they end with "!".
 *
 * Used by: {@link setupRoute}
 *
 * @private
 */
function parseSearchKeys(
  route: string,
  start: number,
  settings: ISettings,
  keyPath: string,
): ISearchKeys | undefined {
  const declaration = route.slice(start);
  if (settings.validate && !SEARCH_KEYS_REGEX.test(declaration)) {
    throw Errors.Template(keyPath, route);
  }
  const allowed = new Set<string>(),
    required: string[] = [];
  for (const [, key] of declaration.matchAll(SEARCH_KEY_REGEX)) {
    const isRequired = key.endsWith('!'),
      name = isRequired ? key.slice(0, -1) : key;
    if (settings.validate && allowed.has(name)) {
      throw Errors.Template(keyPath, route);
    }
    allowed.add(name);
    if (isRequired) {
      required.push(name);
    }
  }
  // Nothing declared (only possible when validation is disabled), so accept
  // any keys, the same as the types.
  return allowed.size > 0 ? { allowed, required } : undefined;
}

/**
 * Initialize the function which builds the url. Insertion functions (urls
 * with path params) always require the path params and take optional search
 * params. Routes with a required search key always require the search params.
 * Functions which need arguments have a "$tmpl" property: the complete path
 * template (including parent paths and any prefix). All other functions
 * return their url when called with no arguments, and otherwise require the
 * search params. Routes which declare search keys only accept those keys.
 * Every function has a "$path" property which is the local path template.
 *
 * Used by: {@link setupNode}, {@link setupRoute}
 *
 * @private
 */
function setupPathFn(
  partialUrl: string,
  fullUrl: string,
  settings: ISettings,
  keyPath: string | undefined,
  isBaseKey: boolean,
  searchKeys?: ISearchKeys,
): PathFunction {
  if (settings.validate) {
    validateTemplate(partialUrl, fullUrl, keyPath, isBaseKey);
  }
  const { prepend } = settings,
    template = prepend + fullUrl,
    urlTemplate = compileTemplate(fullUrl),
    hasRequiredKeys =
      searchKeys !== undefined && searchKeys.required.length > 0;
  // Setup the function
  let retVal: (...args: unknown[]) => string;
  const isInsertion = urlTemplate.names.length > 0;
  if (isInsertion) {
    // The path params are always required: "$tmpl" has the template
    retVal = (pathValues: unknown, searchValues?: unknown) => {
      const url = prepend + insertPathParams(urlTemplate, pathValues);
      // Omitted search params still have to satisfy required search keys
      if (searchValues === undefined && !hasRequiredKeys) {
        return url;
      }
      return (
        url +
        setupSearchParams(
          searchValues === undefined ? {} : searchValues,
          searchKeys,
        )
      );
    };
  } else if (hasRequiredKeys) {
    // Omitted search params still have to satisfy the required search keys
    retVal = (searchValues?: unknown) =>
      template +
      setupSearchParams(
        searchValues === undefined ? {} : searchValues,
        searchKeys,
      );
  } else {
    // Only a call with no arguments returns the url as is, so passing
    // "undefined" (i.e. a missing variable) is still validated.
    retVal = (...args: unknown[]) =>
      args.length === 0
        ? template
        : template + setupSearchParams(args[0], searchKeys);
  }
  // Return. Functions which need arguments have the template on "$tmpl".
  addProperty(retVal, PATH_KEY, partialUrl);
  if (isInsertion || hasRequiredKeys) {
    addProperty(retVal, TEMPLATE_KEY, template);
  }
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
      ? PATH_KEY
      : `${keyPath}.${PATH_KEY}`
    : (keyPath ?? ROOT_KEY_PATH);
  // Only "$path" may be empty, everything else must start with a "/"
  if (!isBaseKey && !partialUrl.startsWith('/')) {
    throw Errors.Template(errorKeyPath, partialUrl);
  } else if (!TEMPLATE_REGEX.test(partialUrl)) {
    throw Errors.Template(errorKeyPath, partialUrl);
  } else if (!TEMPLATE_REGEX.test(fullUrl)) {
    throw Errors.Template(errorKeyPath, fullUrl);
  }
}

/**
 * Split the url around its path params once, at setup time, so calls don't
 * need to run a regex.
 *
 * Used by: {@link setupPathFn}
 *
 * @private
 */
function compileTemplate(url: string): IUrlTemplate {
  const statics: string[] = [],
    names: string[] = [];
  let last = 0;
  for (const match of url.matchAll(PARAM_REGEX)) {
    statics.push(url.slice(last, match.index) + '/');
    names.push(match[1]);
    last = match.index + match[0].length;
  }
  statics.push(url.slice(last));
  return { url, statics, names, unique: [...new Set(names)] };
}

/**
 * Insert the path values into the url. The path values object is required,
 * use "$tmpl" for the complete path template.
 *
 * Used by: {@link setupPathFn}
 *
 * @private
 */
function insertPathParams(
  urlTemplate: IUrlTemplate,
  pathValues: unknown,
): string {
  const { url, statics, names, unique } = urlTemplate;
  // Validate
  if (typeof pathValues !== 'object' || pathValues === null) {
    throw Errors.PathParamsType(url);
  } else if (unique.length !== Object.keys(pathValues).length) {
    throw Errors.KeyNameLength(url);
  }
  for (const name of unique) {
    if (!Object.hasOwn(pathValues, name)) {
      throw Errors.KeyMissing(name);
    }
  }
  // Join the text around the params with the encoded values
  const values = pathValues as Record<string, unknown>;
  let retVal = statics[0];
  for (let i = 0; i < names.length; i++) {
    retVal += encodePathValue(names[i], values[names[i]]) + statics[i + 1];
  }
  return retVal;
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
 * "undefined" values are skipped. If the route declared search keys, other
 * keys are rejected and required keys must have at least one value.
 *
 * Used by: {@link setupPathFn}
 *
 * @private
 */
function setupSearchParams(
  searchValues: unknown,
  searchKeys?: ISearchKeys,
): string {
  // Validate
  if (typeof searchValues !== 'object' || searchValues === null) {
    throw Errors.SearchParamsType();
  }
  // Setup the query string. Own keys are read directly and appended to a
  // string, so a call doesn't allocate arrays for every key.
  const values = searchValues as Record<string, unknown>;
  let retVal = '';
  for (const key in values) {
    if (!Object.hasOwn(values, key)) {
      continue;
    } else if (searchKeys !== undefined && !searchKeys.allowed.has(key)) {
      throw Errors.SearchKeyUnknown(key);
    }
    // A single value is handled as a list of one
    const value = values[key],
      list = Array.isArray(value) ? (value as unknown[]) : undefined,
      length = list === undefined ? 1 : list.length;
    let encodedKey: string | undefined;
    for (let i = 0; i < length; i++) {
      const item = list === undefined ? value : list[i];
      if (item === undefined) {
        continue;
      } else if (!isPrimitive(item)) {
        throw Errors.SearchValue(key);
      }
      encodedKey ??= encodeURIComponent(key);
      retVal +=
        (retVal === '' ? '?' : '&') +
        encodedKey +
        '=' +
        encodeURIComponent(String(item));
    }
  }
  // Required keys need at least one value
  if (searchKeys !== undefined) {
    for (const key of searchKeys.required) {
      if (!hasSearchValue(values, key)) {
        throw Errors.SearchKeyMissing(key);
      }
    }
  }
  // Return
  return retVal;
}

/**
 * Check if a search key has at least one value, the same way
 * "setupSearchParams" decides whether to append it.
 *
 * Used by: {@link setupSearchParams}
 *
 * @private
 */
function hasSearchValue(values: Record<string, unknown>, key: string): boolean {
  if (!Object.prototype.propertyIsEnumerable.call(values, key)) {
    return false;
  }
  const value = values[key];
  return Array.isArray(value)
    ? value.some((item) => item !== undefined)
    : value !== undefined;
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default jetPaths;
