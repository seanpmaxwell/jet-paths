import type { BASE_KEY } from '../constants/misc';
import type { ArgObj, IOptions, PathParams, SearchParams } from './misc';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type BaseKey = typeof BASE_KEY;

type CollapseType<T> = {
  -readonly [K in keyof T]: T[K];
} & {};

// ============================== `SetupNode` ============================== //

type ResolveType<
  S extends string,
  P = CollapseType<PathParams<S>>,
> = S extends `${string}/:${string}`
  ? <T extends object>(pathParams?: P, searchParams?: SearchParams<T>) => S
  : <T extends object>(searchParams?: SearchParams<T>) => S;

// Joins two path segments, handling slashes cleanly.
type Join<A extends string, B extends string> = A extends ''
  ? B
  : B extends ''
    ? A
    : `${A}${B}`;

// A function which returns the full url, with the original partial url on "_"
type PathFn<Full extends string, Part extends string> = ResolveType<Full> & {
  readonly _: Part;
};

// Recursively setup a function for every key, prefixing the full url
type SetupNode<T extends ArgObj, Full extends string> = PathFn<
  Full,
  T[BaseKey]
> & {
  readonly [K in keyof T as K extends BaseKey ? never : K]: T[K] extends string
    ? PathFn<Join<Full, T[K]>, T[K]>
    : T[K] extends ArgObj
      ? SetupNode<T[K], Join<Full, T[K][BaseKey]>>
      : never;
};

// ============================= `SetupPrefix` ============================= //

type SetupPrefix<
  T extends ArgObj,
  U extends IOptions | undefined,
> = undefined extends U
  ? T[BaseKey]
  : U extends IOptions
    ? U['prepend'] extends string
      ? `${U['prepend']}${T[BaseKey]}`
      : T[BaseKey]
    : never;

// ========================== `ResolvePathsObject` ========================= //

export type ResolvePathsObject<
  T extends ArgObj,
  U extends IOptions | undefined,
> = SetupNode<T, SetupPrefix<T, U>>;
