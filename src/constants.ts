/******************************************************************************
                               Constants
******************************************************************************/

// Misc
export const BASE_KEY = '_';
export const REGEX = /^\/(?:[^\s?#]*)(?:\?[^\s#]*)?(?:#[^\s]*)?$/;

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
  KeyNameLength(path: string) {
    return (
      'The number of keys on the value object did not match the ' +
      `number of URL parameters. Path "${path}".`
    );
  },
  Regex(url: string) {
    return 'URL failed to pass validation: ' + url;
  },
} as const;
