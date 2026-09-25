// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type Primitive = string | number | boolean | null | undefined;
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

export type SearchParams<T extends object> =
  Exclude<keyof T, string> extends never
    ? T extends { [K in keyof T]: Primitive | Primitive[] }
      ? T
      : never
    : never;
