import { expectTypeOf, test } from 'vitest';

import jetPaths from '../../src/index';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const Paths = jetPaths({
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id',
    Two: '/:id/posts/:slug',
  },
});

const PathsPrepend = jetPaths(
  { _: '/api', Users: { _: '/users', One: '/:id' } },
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

test('no arguments returns the template literal type', () => {
  expectTypeOf(Paths()).toEqualTypeOf<'/api'>();
  expectTypeOf(Paths.Users()).toEqualTypeOf<'/api/users'>();
  expectTypeOf(Paths.Users.Get()).toEqualTypeOf<'/api/users/all'>();
  expectTypeOf(Paths.Users.One()).toEqualTypeOf<'/api/users/:id'>();
  expectTypeOf(
    PathsPrepend.Users.One(),
  ).toEqualTypeOf<'http://localhost:3000/api/users/:id'>();
});

test('formatted urls are typed as string', () => {
  expectTypeOf(Paths.Users.One({ id: 5 })).toEqualTypeOf<string>();
  expectTypeOf(Paths.Users.One(undefined, { q: 1 })).toEqualTypeOf<string>();
  expectTypeOf(Paths.Users.Get({ page: 2 })).toEqualTypeOf<string>();
});

test('"_" is the readonly partial path', () => {
  expectTypeOf(Paths._).toEqualTypeOf<'/api'>();
  expectTypeOf(Paths.Users._).toEqualTypeOf<'/users'>();
  expectTypeOf(Paths.Users.One._).toEqualTypeOf<'/:id'>();
  typeOnly(() => {
    // @ts-expect-error - readonly
    Paths.Users._ = '/x';
  });
});

test('path params must match the param names', () => {
  expectTypeOf(Paths.Users.Two)
    .parameter(0)
    .toEqualTypeOf<{ id: Primitive; slug: Primitive } | undefined>();
  typeOnly(() => {
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
