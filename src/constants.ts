/******************************************************************************
                               Constants
******************************************************************************/

// Misc
export const BASE_KEY = '_';
export const DEFAULT_REGEX = /^[A-Za-z0-9_\/-]+$/;

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
