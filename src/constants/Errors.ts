// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const Errors = {
  BaseKey(keyPath: string) {
    return (
      'Base key "_" must exist on every object and its value must be a ' +
      `string. Key path: "${keyPath}".`
    );
  },
  RouteValue(keyPath: string) {
    return (
      'Route values must be a string or a plain object. Key path: ' +
      `"${keyPath}".`
    );
  },
  Template(keyPath: string, url: string) {
    return (
      `URL failed to pass validation. Key path: "${keyPath}", URL: ` +
      `"${url}".`
    );
  },
  PathParamsType(path: string) {
    return `Path params must be an object. Path "${path}".`;
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
  PathValue(key: string) {
    return (
      `Path value for "${key}" must be a primitive, cannot be empty, and ` +
      'cannot be "." or "..".'
    );
  },
  SearchParamsType() {
    return 'Search params must be an object.';
  },
  SearchValue(key: string) {
    return (
      `Search value for "${key}" must be a primitive or an array of ` +
      'primitives.'
    );
  },
} as const;

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default Errors;
