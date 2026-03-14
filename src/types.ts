import type { BASE_KEY } from './constants.js';

/******************************************************************************
                                   Types
******************************************************************************/

type Primitive = string | number | boolean | null | undefined;
export type Dict = Record<string, unknown>;
type BaseKey = typeof BASE_KEY;

type CollapseType<T> = {
  -readonly [K in keyof T]: T[K];
} & {};

export type ArgObj = {
  _: string;
  [key: string]: string | ArgObj;
};

export interface IOptions {
  prepend?: string;
  disableRegex?: boolean;
}

// ------------------------------ Setup Object ----------------------------- //

type SearchParams<T extends object> =
  Exclude<keyof T, string> extends never
    ? T extends { [K in keyof T]: Primitive | Primitive[] }
      ? T
      : never
    : never;

// -- Setup the PathParams object -- //

type ParamNames<Path extends string> =
  Path extends `${string}/:${infer Param}/${infer Rest}`
    ? Param | ParamNames<`/${Rest}`>
    : Path extends `${string}/:${infer Param}`
      ? Param
      : never;

type PathParams<Path extends string> = {
  [K in ParamNames<Path>]: Primitive;
};

// -- Get the type of url params object -- //

type ResolveType<
  S extends string,
  P = CollapseType<PathParams<S>>,
> = S extends `${string}/:${string}`
  ? <T extends object>(pathParams?: P, searchParams?: SearchParams<T>) => S
  : <T extends object>(searchParams?: SearchParams<T>) => S;

// Set different functions
type Iterate<T extends object> = {
  [K in keyof T]: T[K] extends string
    ? ResolveType<T[K]>
    : T[K] extends object
      ? CollapseType<Iterate<T[K]>>
      : never;
};

// -- ExpandPaths -- //

// Joins two path segments, handling slashes cleanly.
type Join<A extends string, B extends string> = A extends ''
  ? B
  : B extends ''
    ? A
    : `${A}${B}`;

// Recursively prefix all string paths in an object
type ExpandPaths<T extends ArgObj, Prefix extends string> = {
  [K in keyof T]: T[K] extends string
    ? K extends '_'
      ? Prefix
      : Join<Prefix, T[K]>
    : T[K] extends ArgObj
      ? ExpandPaths<T[K], Join<Prefix, T[K][BaseKey]>>
      : never;
};

// -- SetupPrefix -- //

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

// -- RetVal -- //

export type RetVal<T extends ArgObj, U extends IOptions | undefined> = Iterate<
  ExpandPaths<T, SetupPrefix<T, U>>
>;
