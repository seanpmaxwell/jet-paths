/******************************************************************************
                               Constants
******************************************************************************/

// Misc
export const BASE_KEY = '_';
export const REGEX_INCOMING =
  /^\/(?:[A-Za-z0-9._~-]+|:[A-Za-z][A-Za-z0-9_]*)(?:\/(?:[A-Za-z0-9._~-]+|:[A-Za-z][A-Za-z0-9_]*))*(?:\?[A-Za-z][A-Za-z0-9_]*=\{\}(?:&[A-Za-z][A-Za-z0-9_]*=\{\})*)?$/;
export const REGEX_FORMATTED =
  /^\/(?:[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*)?(?:\?[A-Za-z0-9._~-]+=[^&#\s]*(?:&[A-Za-z0-9._~-]+=[^&#\s]*)*)?$/;

// Errors
export const Errors = {
  BaseKey(key: string) {
    return (
      'Base key must exist on every object and the value must be a string: ' +
      key
    );
  },
  StrictKeyName(key: string) {
    return (
      `Option :strictKeysNames is set to return true but the "${key}" was ` +
      'not present on the object.'
    );
  },
  STRICT_KEY_NAME_LENGTH:
    'Option :strictKeyNames is set to true but but the number of object ' +
    'keys did not match the number of URL parameters.',
  REGEX: 'URL failed regular expression check',
} as const;
