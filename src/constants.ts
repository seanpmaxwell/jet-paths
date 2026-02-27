/******************************************************************************
                               Constants
******************************************************************************/

// Misc
export const BASE_KEY = '_';
export const REGEX_PATHNAME = /^\/(?:[^\s\/?#]+\/?)*$/;
export const REGEX_SEARCH_QUERY =
  /^\?(?:[A-Za-z0-9._~-]+=(?:[^&#]*)?)(?:&[A-Za-z0-9._~-]+=(?:[^&#]*)?)*/;

// Errors
export const Errors = {
  BaseKey(key: string) {
    return (
      'Base key must exist on every object and the value must be a string: ' +
      key
    );
  },
  KeyMissing(key: string) {
    return `The "${key}" was not present on the value object.`;
  },
  ForwardSlash(path: string, parentPath = '') {
    return (
      'All paths must start with a foward-slash "/". Path: ' +
      `"${path}"${parentPath ? `, Parent path: "${parentPath}".` : '.'}`
    );
  },
  KeyNameLength(path: string) {
    return (
      'The number of keys on the value object did not match the ' +
      `number of URL parameters. Path "${path}".`
    );
  },
  RegexPath(path: string) {
    return 'URL "path" failed regular expression check: ' + path;
  },
  RegexSearch(searchStr: string) {
    return 'URL "search" params failed regular expression check: ' + searchStr;
  },
} as const;
