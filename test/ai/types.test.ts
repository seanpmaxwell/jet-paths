import { expectTypeOf, test } from 'vitest';

import jetPaths from '../../src/index';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const Paths = jetPaths({
  $path: '/api',
  Users: {
    $path: '/users',
    Get: '/all',
    One: '/:id',
    Two: '/:id/posts/:slug',
  },
  Org: {
    $path: '/orgs/:orgId',
    Members: '/members',
    Member: '/members/:memberId',
  },
});

const PathsPrepend = jetPaths(
  { $path: '/api', Users: { $path: '/users', One: '/:id' } },
  { prepend: 'http://localhost:3000' },
);

// ========================================================================= //
//                                   TYPES                                   //
// ========================================================================= //

type Primitive = string | number | boolean | null | undefined;

/**
 * Only type-check the callback, never run it.
 */
function typeOnly(_fn: () => void): void {
  return;
}

// ========================================================================= //
//                                   TESTS                                   //
// ========================================================================= //

// These are compile-time checks (run with "npm run typecheck"). Invalid calls
// are wrapped in "typeOnly" so they are type-checked but never executed.

test('formatted urls are typed as string', () => {
  expectTypeOf(Paths.Users.One({ id: 5 })).toEqualTypeOf<string>();
  expectTypeOf(Paths.Users.One({ id: 5 }, { q: 1 })).toEqualTypeOf<string>();
  expectTypeOf(Paths.Users.Get({ page: 2 })).toEqualTypeOf<string>();
  expectTypeOf(Paths.Users.Get({})).toEqualTypeOf<string>();
  expectTypeOf(Paths({ page: 2 })).toEqualTypeOf<string>();
});

test('"$path" is the readonly local path template', () => {
  expectTypeOf(Paths.$path).toEqualTypeOf<'/api'>();
  expectTypeOf(Paths.Users.$path).toEqualTypeOf<'/users'>();
  expectTypeOf(Paths.Users.One.$path).toEqualTypeOf<'/:id'>();
  expectTypeOf(Paths.Org.$path).toEqualTypeOf<'/orgs/:orgId'>();
  expectTypeOf(Paths.Org.Members.$path).toEqualTypeOf<'/members'>();
  typeOnly(() => {
    // @ts-expect-error - readonly
    Paths.Users.$path = '/x';
  });
});

test('"$path" is required on every object', () => {
  typeOnly(() => {
    // @ts-expect-error - root "$path" is missing
    jetPaths({ Users: { $path: '/users' } });
    // @ts-expect-error - nested "$path" is missing
    jetPaths({ $path: '/api', Users: { Get: '/all' } });
  });
});

test('"$path" must be a string', () => {
  typeOnly(() => {
    // @ts-expect-error - root "$path" is a number
    jetPaths({ $path: 5 });
    // @ts-expect-error - nested "$path" is an object
    jetPaths({ $path: '/api', Users: { $path: { Get: '/all' } } });
  });
});

test('non-insertion functions: no arguments returns the url', () => {
  expectTypeOf(Paths()).toEqualTypeOf<'/api'>();
  expectTypeOf(Paths.Users()).toEqualTypeOf<'/api/users'>();
  expectTypeOf(Paths.Users.Get()).toEqualTypeOf<'/api/users/all'>();
  expectTypeOf(
    PathsPrepend.Users(),
  ).toEqualTypeOf<'http://localhost:3000/api/users'>();
  typeOnly(() => {
    // @ts-expect-error - only insertion functions have "$tmpl"
    void Paths.Users.Get.$tmpl;
    // @ts-expect-error - only insertion functions have "$tmpl"
    void Paths.Users.$tmpl;
    // @ts-expect-error - only insertion functions have "$tmpl"
    void Paths.$tmpl;
  });
});

test('"$tmpl" is the readonly complete path template', () => {
  expectTypeOf(Paths.Users.One.$tmpl).toEqualTypeOf<'/api/users/:id'>();
  expectTypeOf(
    Paths.Users.Two.$tmpl,
  ).toEqualTypeOf<'/api/users/:id/posts/:slug'>();
  expectTypeOf(Paths.Org.$tmpl).toEqualTypeOf<'/api/orgs/:orgId'>();
  expectTypeOf(
    Paths.Org.Members.$tmpl,
  ).toEqualTypeOf<'/api/orgs/:orgId/members'>();
  expectTypeOf(
    Paths.Org.Member.$tmpl,
  ).toEqualTypeOf<'/api/orgs/:orgId/members/:memberId'>();
  expectTypeOf(
    PathsPrepend.Users.One.$tmpl,
  ).toEqualTypeOf<'http://localhost:3000/api/users/:id'>();
  typeOnly(() => {
    // @ts-expect-error - readonly
    Paths.Users.One.$tmpl = '/x';
  });
});

test('"$tmpl" is a reserved route name', () => {
  typeOnly(() => {
    // @ts-expect-error - reserved at the root
    jetPaths({ $path: '/api', $tmpl: '/a' });
    // @ts-expect-error - reserved in nested groups
    jetPaths({ $path: '/api', Users: { $path: '/users', $tmpl: '/a' } });
  });
});

test('non-insertion functions: arguments must be search params', () => {
  typeOnly(() => {
    // @ts-expect-error - "undefined" is not a search params object
    Paths.Users.Get(undefined);
    // @ts-expect-error - "undefined" is not a search params object
    Paths(undefined);
  });
});

test('insertion functions always require the path params', () => {
  typeOnly(() => {
    // @ts-expect-error - path params are required
    Paths.Users.One();
    // @ts-expect-error - params from the parent are required
    Paths.Org();
    // @ts-expect-error - params from the parent are required
    Paths.Org.Members();
    // @ts-expect-error - path params are required
    Paths.Users.One(undefined);
    // @ts-expect-error - path params are required when passing arguments
    Paths.Users.One(undefined, { q: 1 });
    // @ts-expect-error - search params can't be passed first
    Paths.Users.One({ q: 1 }, { id: 1 });
    // @ts-expect-error - params from the parent are required
    Paths.Org.Member({ memberId: 1 });
    // @ts-expect-error - params from the parent are required
    Paths.Org.Members({});
  });
});

test('path params must match the param names', () => {
  expectTypeOf<Parameters<typeof Paths.Users.One>[0]>().toMatchTypeOf<{
    id: Primitive;
  }>();
  expectTypeOf<Parameters<typeof Paths.Users.Two>[0]>().toMatchTypeOf<{
    id: Primitive;
    slug: Primitive;
  }>();
  expectTypeOf<Parameters<typeof Paths.Org.Members>[0]>().toMatchTypeOf<{
    orgId: Primitive;
  }>();
  expectTypeOf<Parameters<typeof Paths.Org.Member>[0]>().toMatchTypeOf<{
    orgId: Primitive;
    memberId: Primitive;
  }>();
  typeOnly(() => {
    // @ts-expect-error - unknown key
    Paths.Users.One({ name: 5 });
    // @ts-expect-error - missing "slug"
    Paths.Users.Two({ id: 1 });
    // @ts-expect-error - unknown key
    Paths.Users.Two({ id: 1, slug: 'a', extra: 'x' });
    // @ts-expect-error - routes without params take search params only
    Paths.Users.Get({ id: 1 }, { q: 1 });
  });
});

test('search params accept interfaces, primitives, and arrays', () => {
  interface ISearch {
    q: string;
    ids: number[];
    tags: readonly string[];
    flag?: boolean;
  }
  const search: ISearch = { q: 'a', ids: [1], tags: ['x'] as const };
  expectTypeOf(Paths.Users.Get(search)).toEqualTypeOf<string>();
});

test('search params reject objects', () => {
  typeOnly(() => {
    // @ts-expect-error - Date is not a primitive
    Paths.Users.Get({ when: new Date() });
    // @ts-expect-error - nested object
    Paths.Users.One({ id: 1 }, { meta: { role: 'admin' } });
  });
});

// ========================== Declared Search Keys ========================= //

const PathsSearch = jetPaths({
  $path: '/api',
  Users: {
    $path: '/users',
    Search: '/search?<q!><page><sort>',
    Filter: '/filter?<page><sort>',
    One: '/:id?<expand>',
    Posts: '/:id/posts?<tag!>',
  },
});

test('declared search keys are not part of "$path" or the template', () => {
  expectTypeOf(PathsSearch.Users.Search.$path).toEqualTypeOf<'/search'>();
  expectTypeOf(
    PathsSearch.Users.Search.$tmpl,
  ).toEqualTypeOf<'/api/users/search'>();
  expectTypeOf(PathsSearch.Users.One.$path).toEqualTypeOf<'/:id'>();
  expectTypeOf(PathsSearch.Users.One.$tmpl).toEqualTypeOf<'/api/users/:id'>();
  // The path params don't include the declaration
  expectTypeOf<Parameters<typeof PathsSearch.Users.One>[0]>().toMatchTypeOf<{
    id: Primitive;
  }>();
});

test('declared search keys are type-checked', () => {
  interface IQuery {
    q: string;
    page?: number;
  }
  const query: IQuery = { q: 'x' };
  expectTypeOf(PathsSearch.Users.Search({ q: 'x' })).toEqualTypeOf<string>();
  expectTypeOf(
    PathsSearch.Users.Search({ q: ['a', 'b'], page: 2, sort: null }),
  ).toEqualTypeOf<string>();
  expectTypeOf(PathsSearch.Users.Search(query)).toEqualTypeOf<string>();
  expectTypeOf(PathsSearch.Users.Filter({})).toEqualTypeOf<string>();
  expectTypeOf(PathsSearch.Users.One({ id: 1 })).toEqualTypeOf<string>();
  expectTypeOf(
    PathsSearch.Users.One({ id: 1 }, { expand: true }),
  ).toEqualTypeOf<string>();
  expectTypeOf(
    PathsSearch.Users.Posts({ id: 1 }, { tag: 'a' }),
  ).toEqualTypeOf<string>();
  typeOnly(() => {
    // @ts-expect-error - unknown key
    PathsSearch.Users.Search({ q: 'x', pgae: 2 });
    // @ts-expect-error - unknown key on a route with only optional keys
    PathsSearch.Users.Filter({ nope: 1 });
    // @ts-expect-error - unknown key on an insertion function
    PathsSearch.Users.One({ id: 1 }, { expnd: true });
    const extra = { q: 'x', extra: 1 };
    // @ts-expect-error - extra keys on variables are rejected
    PathsSearch.Users.Search(extra);
    // @ts-expect-error - search values cannot be nested objects
    PathsSearch.Users.Search({ q: { a: 1 } });
  });
});

test('required search keys must have a value', () => {
  typeOnly(() => {
    // @ts-expect-error - missing required "q"
    PathsSearch.Users.Search({ page: 2 });
    // @ts-expect-error - required keys can't be undefined
    PathsSearch.Users.Search({ q: undefined });
    // @ts-expect-error - insertion functions need them for a required key
    PathsSearch.Users.Posts({ id: 1 });
    // @ts-expect-error - routes with a required key need the search params
    PathsSearch.Users.Search();
    // @ts-expect-error - only routes which need arguments have "$tmpl"
    void PathsSearch.Users.Filter.$tmpl;
  });
  // "$tmpl" is the template, without the declared keys
  expectTypeOf(
    PathsSearch.Users.Search.$tmpl,
  ).toEqualTypeOf<'/api/users/search'>();
  expectTypeOf(
    PathsSearch.Users.Posts.$tmpl,
  ).toEqualTypeOf<'/api/users/:id/posts'>();
  // Only optional keys: no arguments still returns the url
  expectTypeOf(PathsSearch.Users.Filter()).toEqualTypeOf<'/api/users/filter'>();
});
