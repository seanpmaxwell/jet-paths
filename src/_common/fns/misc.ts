import type { Primitive } from '../types/misc';

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

/**
 * Use "defineProperty" so keys which collide with built-in function
 * properties (i.e. "name", "length") can still be set.
 */
export function addProperty(target: object, key: string, value: unknown): void {
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
 */
export function isPrimitive(value: unknown): value is Primitive {
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
 * Accept plain route objects and null-prototype dictionaries. Instances and
 * custom prototypes are rejected because traversal reads own properties only.
 *
 * Used by: {@link setupNode}
 *
 * @private
 */
export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
