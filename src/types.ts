import type { BASE_KEY } from './constants';

/******************************************************************************
                                   Types
******************************************************************************/

type URLParam = string | number | boolean | null | undefined;
type URLParamObject = Record<string, URLParam>;
export type URLParams = URLParam | URLParamObject;
type BaseKey = typeof BASE_KEY;

export type ArgObj = {
  _: string;
  [key: string]: string | ArgObj;
};

export interface IOptions {
  prepend?: string;
  strictKeyNames?: boolean;
  regex?: true | RegExp;
}

// ------------------------------- Iterate --------------------------------- //

type ResolveType<S extends string> = S extends `${string}/:${string}`
  ? (urlParams?: URLParams) => S
  : S;

// Set string or function type
type Iterate<T extends object> = {
  [K in keyof T]: T[K] extends string
    ? ResolveType<T[K]>
    : T[K] extends object
      ? Iterate<T[K]>
      : never;
};

// --------------------------- ExpandPaths --------------------------------- //

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

// ------------------------------ Setup Prefix ----------------------------- //

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

// ------------------------------- ResolveRetVal --------------------------- //

// pick up here, get CollapseType working

// Must be defined in the file it is used in
type Collapse<T> = {
  -readonly [K in keyof T]: T[K];
} & {};

export type ResolveRetVal<
  T extends ArgObj,
  U extends IOptions | undefined,
> = Collapse<Iterate<ExpandPaths<T, SetupPrefix<T, U>>>>;
