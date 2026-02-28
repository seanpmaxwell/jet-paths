import type { BASE_KEY } from './constants';

/******************************************************************************
                                   Types
******************************************************************************/

type Primitive = string | number | boolean | null | undefined;

export type PathValues = Record<string, Primitive>;
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

// ------------------------------ Setup Prefix ----------------------------- //

type ResolveType<S extends string> = S extends `${string}/:${string}`
  ? (pathParams?: PathValues, searchParams?: SearchValues) => S
  : (searchParams?: SearchValues) => S;

// Set string or function type
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

// ------------------------- Appending Search Params ----------------------- //

type SearchValuesArray = (
  | Primitive
  | Date
  | SearchValues
  | SearchValuesArray
)[];

export type SearchValues = {
  [key: string]: Primitive | Date | SearchValues | SearchValuesArray;
};
