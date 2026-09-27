// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

// "captureStackTrace" isn't part of the standard library and not every engine
// has it. It leaves "omit" and the frames above it out of the stack trace.
type ErrorConstructorWithCapture = ErrorConstructor & {
  captureStackTrace?: (
    target: object,
    omit?: (...args: never[]) => unknown,
  ) => void;
};

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

const Errors = {
  PathKey: defineError(
    (keyPath: string) =>
      'Key "$path" must exist on every object and its value must be a ' +
      `string. Key path: "${keyPath}".`,
  ),
  ReservedKey: defineError(
    (keyPath: string) =>
      'Key "$tmpl" is reserved for the complete path template of routes ' +
      `which need arguments. Key path: "${keyPath}".`,
  ),
  ThenKey: defineError(
    (keyPath: string) =>
      `Key "then" is reserved to prevent promise assimilation. Key path: "${keyPath}".`,
  ),
  CircularRoute: defineError(
    (keyPath: string) => `Circular route definition. Key path: "${keyPath}".`,
  ),
  RouteValue: defineError(
    (keyPath: string) =>
      'Route values must be a string or a plain object. Key path: ' +
      `"${keyPath}".`,
  ),
  Template: defineError(
    (keyPath: string, url: string) =>
      `URL failed to pass validation. Key path: "${keyPath}", URL: ` +
      `"${url}".`,
  ),
  PathParamsType: defineError(
    (path: string) =>
      `Path params must be an object. Path "${path}". Use "$tmpl" for ` +
      'the path template.',
  ),
  KeyMissing: defineError(
    (key: string) => `The "${key}" was not present on the value object.`,
  ),
  KeyNameLength: defineError(
    (path: string) =>
      'The number of keys on the value object did not match the ' +
      `number of URL parameters. Path "${path}".`,
  ),
  PathValue: defineError(
    (key: string) =>
      `Path value for "${key}" must be a primitive, cannot be empty, and ` +
      'cannot be "." or "..".',
  ),
  SearchParamsType: defineError(() => 'Search params must be an object.'),
  SearchValue: defineError(
    (key: string) =>
      `Search value for "${key}" must be a primitive or an array of ` +
      'primitives.',
  ),
  SearchKeyUnknown: defineError(
    (key: string) => `Search key "${key}" is not declared on the route.`,
  ),
  SearchKeyMissing: defineError(
    (key: string) => `Search key "${key}" is required and must have a value.`,
  ),
} as const;

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Turn a message builder into a function which creates the error. Its stack
 * trace starts where that function was called (i.e. "throw Errors.Template()")
 * instead of in this file.
 *
 * Used by: {@link Errors}
 *
 * @private
 */
function defineError<Args extends unknown[]>(
  getMessage: (...args: Args) => string,
): (...args: Args) => Error {
  const create = (...args: Args): Error => {
    const error = new Error(getMessage(...args));
    // Not every engine supports this, the stack is one frame longer there
    (Error as ErrorConstructorWithCapture).captureStackTrace?.(error, create);
    return error;
  };
  return create;
}

// ========================================================================= //
//                                  EXPORT                                   //
// ========================================================================= //

export default Errors;
