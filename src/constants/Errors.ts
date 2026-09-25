// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const Errors = {
  BaseKey(keyPath: string) {
    return new Error(
      'Base key "_" must exist on every object and its value must be a ' +
        `string. Key path: "${keyPath}".`,
    );
  },
  RouteValue(keyPath: string) {
    return new Error(
      'Route values must be a string or a plain object. Key path: ' +
        `"${keyPath}".`,
    );
  },
  Template(keyPath: string, url: string) {
    return new Error(
      `URL failed to pass validation. Key path: "${keyPath}", URL: ` +
        `"${url}".`,
    );
  },
  PathParamsType(path: string) {
    return new Error(`Path params must be an object. Path "${path}".`);
  },
  KeyMissing(key: string) {
    return new Error(`The "${key}" was not present on the value object.`);
  },
  KeyNameLength(path: string) {
    return new Error(
      'The number of keys on the value object did not match the ' +
        `number of URL parameters. Path "${path}".`,
    );
  },
  PathValue(key: string) {
    return new Error(
      `Path value for "${key}" must be a primitive, cannot be empty, and ` +
        'cannot be "." or "..".',
    );
  },
  SearchParamsType() {
    return new Error('Search params must be an object.');
  },
  SearchValue(key: string) {
    return new Error(
      `Search value for "${key}" must be a primitive or an array of ` +
        'primitives.',
    );
  },
} as const;

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default Errors;
