// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

export type Primitive = string | number | boolean | null | undefined;
export type Dict = Record<string, unknown>;

export type ArgObj = {
  _: string;
  [key: string]: string | ArgObj;
};

export interface IOptions {
  prepend?: string;
  disableRegex?: boolean;
}

// =============================== Url Stuff =============================== //

type ParamNames<Path extends string> =
  Path extends `${string}/:${infer Param}/${infer Rest}`
    ? Param | ParamNames<`/${Rest}`>
    : Path extends `${string}/:${infer Param}`
      ? Param
      : never;

export type PathParams<Path extends string> = {
  [K in ParamNames<Path>]: Primitive;
};

type SearchParamValue = Primitive | readonly Primitive[];

type SearchParamsError =
  'Error: search param values must be a primitive or an array of primitives';

// Using a generic lets interfaces be passed (they have no index signature).
// Invalid properties resolve to an error message so the compiler error
// points at the offending key.
export type SearchParams<T extends object> = {
  [K in keyof T]: T[K] extends SearchParamValue ? T[K] : SearchParamsError;
};
