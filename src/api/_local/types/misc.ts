import { Primitive } from '@cmn/types/misc';

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

export interface JetPathsOptions {
  prepend?: string;
  disableRegex?: boolean;
}

// ========================== The Main Api Object ========================== //

export type JetPathsParamObject = {
  $path: string;
  [key: string]: string | JetPathsParamObject;
};

// Literal templates are needed to distinguish path params from search params.
// Preserve inference through the intersection at the public entry point.
type IsLiteralTemplate<S extends string> = string extends S
  ? false
  : S extends ''
    ? true
    : S extends `${infer Head}${infer Tail}`
      ? `${number}` extends Head
        ? false
        : `${bigint}` extends Head
          ? false
          : IsLiteralTemplate<Tail>
      : false;

export type ValidateJetPathsObject<T extends JetPathsParamObject> = {
  [K in keyof T]: K extends '$tmpl' | 'then'
    ? never
    : T[K] extends string
      ? IsLiteralTemplate<T[K]> extends true
        ? T[K]
        : 'Error: use a literal route template (define the object with as const)'
      : T[K] extends JetPathsParamObject
        ? ValidateJetPathsObject<T[K]>
        : never;
};

// ========================== Function Parameters ========================== //

// ---- `PathParams`
type ParamNames<Path extends string> =
  Path extends `${string}/:${infer Param}/${infer Rest}`
    ? Param | ParamNames<`/${Rest}`>
    : Path extends `${string}/:${infer Param}`
      ? Param
      : never;

export type PathParams<Path extends string> = {
  [K in ParamNames<Path>]: Primitive;
};

// ---- `SearchParams`
type SearchParamValue = Primitive | readonly Primitive[];
type SearchParamsError =
  'Error: search param values must be a primitive or an array of primitives';

// Using a generic lets interfaces be passed (they have no index signature).
// Invalid properties resolve to an error message so the compiler error
// points at the offending key.
export type SearchParams<T extends object> = {
  [K in keyof T]: T[K] extends SearchParamValue ? T[K] : SearchParamsError;
};

// =========================== Search Parameters =========================== //

export type RoutePath<Route extends string> =
  Route extends `${infer Path}?${string}` ? Path : Route;

// Without any "<key>" nothing is declared, the same as at runtime.
export type RouteSearchKeys<Route extends string> =
  Route extends `${string}?${infer Keys}`
    ? [SplitSearchKeys<Keys>] extends [never]
      ? never
      : Keys
    : never;
// Reads each "<key>". Must stay in sync with "SEARCH_KEY_REGEX".
type SplitSearchKeys<Keys extends string> =
  Keys extends `${string}<${infer Key}>${infer Rest}`
    ? Key | SplitSearchKeys<Rest>
    : never;

// ---- `HasRequiredSearchKey`
// Check if there are required Search Params
export type HasRequiredSearchKey<Keys extends string> = [
  Extract<SplitSearchKeys<Keys>, `${string}!`>,
] extends [never]
  ? false
  : true;
type DeclaredSearchParamsHelper<Key extends string> = {
  [K in Key as K extends `${infer Name}!` ? Name : never]: Exclude<
    SearchParamValue,
    undefined
  >;
} & {
  [K in Key as K extends `${string}!` ? never : K]?: SearchParamValue;
};

// ---- `DeclaredSearchParams`
// Routes can declare their search keys after a "?" (i.e. "/search?<q!><page>").
// Keys are optional unless they end with "!". Required keys need a value.
export type DeclaredSearchParams<Keys extends string> = {
  [
    K in keyof DeclaredSearchParamsHelper<SplitSearchKeys<Keys>>
  ]: DeclaredSearchParamsHelper<SplitSearchKeys<Keys>>[K];
};
