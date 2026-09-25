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

export type RetVal<
  T extends ArgObj,
  U extends IOptions | undefined,
> = SetupNode<T, SetupPrefix<T, U>>;
