import type { PATH_KEY } from '../constants/misc';
import type {
  DeclaredSearchParams,
  HasRequiredSearchKey,
  JetPathsOptions,
  JetPathsParamObject,
  PathParams,
  RoutePath,
  RouteSearchKeys,
  SearchParams,
} from './misc';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type PathKey = typeof PATH_KEY;

// ============================== `SetupNode` ============================== //

// A url with at least one path param.
type ParamUrl = `${string}/:${string}`;

// Rejects keys which aren't in "Expected", even through variables and spreads.
// Without extra keys it's just "Actual", so errors show the expected type.
type Exact<Actual, Expected> = [Exclude<keyof Actual, keyof Expected>] extends [
  never,
]
  ? Actual
  : Actual & Record<Exclude<keyof Actual, keyof Expected>, never>;

// An insertion function (a url with path params). The path params object is
// required. The search params are optional, unless the route declares a
// required search key.
type InsertionFn<
  S extends string,
  Keys extends string,
  P = { [K in keyof PathParams<S>]: PathParams<S>[K] },
  D = DeclaredSearchParams<Keys>,
> = [Keys] extends [never]
  ? {
      <Actual extends P, T extends object>(
        pathParams: Exact<Actual, P>,
        searchParams?: SearchParams<T>,
      ): string;
    }
  : HasRequiredSearchKey<Keys> extends true
    ? {
        <Actual extends P, Search extends D>(
          pathParams: Exact<Actual, P>,
          searchParams: Exact<Search, D>,
        ): string;
      }
    : {
        <Actual extends P, Search extends D>(
          pathParams: Exact<Actual, P>,
          searchParams?: Exact<Search, D>,
        ): string;
      };

// A url without path params. When arguments are passed, the search params are
// required. Routes which declare search keys only accept those keys.
type SearchFn<Keys extends string, D = DeclaredSearchParams<Keys>> = [
  Keys,
] extends [never]
  ? { <T extends object>(searchParams: SearchParams<T>): string }
  : { <Search extends D>(searchParams: Exact<Search, D>): string };

// Concatenates two path segments.
type Join<A extends string, B extends string> = `${A}${B}`;

// A function which builds the url, with the local path template on "$path".
// Functions which need arguments (insertion functions and routes with a
// required search key) can't be called without them, so the complete path
// template (including parent paths and any prefix) is on "$tmpl". Other
// functions return their url when called with no arguments. That signature
// comes first so the other one is what "Parameters" and similar utilities see.
type PathFn<
  Route extends string,
  Part extends string,
  Prefix extends string,
  Keys extends string = never,
> = Route extends ParamUrl
  ? InsertionFn<Route, Keys> & TemplateProps<Route, Part, Prefix>
  : HasRequiredSearchKey<Keys> extends true
    ? SearchFn<Keys> & TemplateProps<Route, Part, Prefix>
    : { (): `${Prefix}${Route}` } & SearchFn<Keys> & { readonly $path: Part };

// The properties of functions which need arguments.
type TemplateProps<
  Route extends string,
  Part extends string,
  Prefix extends string,
> = {
  readonly $path: Part;
  readonly $tmpl: `${Prefix}${Route}`;
};

// Recursively setup a function for every key, prefixing the full url. Search
// keys declared on a route ("/search?<q!><page>") aren't part of its path.
type SetupNode<
  T extends JetPathsParamObject,
  Route extends string,
  Prefix extends string,
> = PathFn<Route, T[PathKey], Prefix> & {
  readonly [K in keyof T as K extends PathKey ? never : K]: T[K] extends string
    ? PathFn<
        Join<Route, RoutePath<T[K]>>,
        RoutePath<T[K]>,
        Prefix,
        RouteSearchKeys<T[K]>
      >
    : T[K] extends JetPathsParamObject
      ? SetupNode<T[K], Join<Route, T[K][PathKey]>, Prefix>
      : never;
};

// ============================= `SetupPrefix` ============================= //

// Distribute over optional options and preserve uncertain prefix values.
type SetupPrefix<U extends JetPathsOptions | undefined> = U extends undefined
  ? ''
  : U extends JetPathsOptions
    ? 'prepend' extends keyof U
      ? | Exclude<U['prepend'], undefined>
        | (undefined extends U['prepend'] ? '' : never)
      : ''
    : never;

// ========================== `ResolvePathsObject` ========================= //

export type ResolveJetPathsObject<
  T extends JetPathsParamObject,
  U extends JetPathsOptions | undefined,
> = SetupNode<T, T[PathKey], SetupPrefix<U>>;
