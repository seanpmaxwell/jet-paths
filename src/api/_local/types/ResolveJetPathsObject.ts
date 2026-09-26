import type { BASE_KEY } from '../constants/misc';
import type {
  JetPathsOptions,
  JetPathsParamObject,
  PathParams,
  SearchParams,
} from './misc';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type BaseKey = typeof BASE_KEY;

// ============================== `SetupNode` ============================== //

// Calling with no arguments returns the template unchanged, so the literal
// type is kept. Otherwise values are inserted and the result is a "string".
type ResolveType<
  S extends string,
  P = { [K in keyof PathParams<S>]: PathParams<S>[K] },
> = S extends `${string}/:${string}`
  ? {
      (): S;
      <T extends object>(
        pathParams: P | undefined,
        searchParams?: SearchParams<T>,
      ): string;
    }
  : {
      (): S;
      <T extends object>(searchParams: SearchParams<T> | undefined): string;
    };

// Concatenates two path segments.
type Join<A extends string, B extends string> = `${A}${B}`;

// A function which returns the full url, with the original partial url on "_"
type PathFn<Full extends string, Part extends string> = ResolveType<Full> & {
  readonly _: Part;
};

// Recursively setup a function for every key, prefixing the full url
type SetupNode<T extends JetPathsParamObject, Full extends string> = PathFn<
  Full,
  T[BaseKey]
> & {
  readonly [K in keyof T as K extends BaseKey ? never : K]: T[K] extends string
    ? PathFn<Join<Full, T[K]>, T[K]>
    : T[K] extends JetPathsParamObject
      ? SetupNode<T[K], Join<Full, T[K][BaseKey]>>
      : never;
};

// ============================= `SetupPrefix` ============================= //

type SetupPrefix<
  T extends JetPathsParamObject,
  U extends JetPathsOptions | undefined,
> = undefined extends U
  ? T[BaseKey]
  : U extends JetPathsOptions
    ? U['prepend'] extends string
      ? `${U['prepend']}${T[BaseKey]}`
      : T[BaseKey]
    : never;

// ========================== `ResolvePathsObject` ========================= //

export type ResolveJetPathsObject<
  T extends JetPathsParamObject,
  U extends JetPathsOptions | undefined,
> = SetupNode<T, SetupPrefix<T, U>>;
