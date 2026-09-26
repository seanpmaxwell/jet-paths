import { expect, test } from 'vitest';

import jetPaths from '../src/index.js';

// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

const PATHS = {
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Posts: {
    _: '/posts',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    Misc: '/misc/:id/something/:foo',
    Else: '/else/:id/something/foo',
    Other: '/other/:id/blah/:name',
    Private: {
      _: '/private',
      Get: '/all',
      Delete: '/delete/:id',
    },
  },
  Foo: '/foo',
} as const;

const PATHS_2 = {
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
} as const;

const PATHS_3 = {
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
} as const;

const PATHS_4 = {
  _: '/api',
  Users: {
    _: '/users',
    Search: '/search',
  },
} as const;

// ========================================================================= //
//                                   TESTS                                   //
// ========================================================================= //

/**
 * Test jetPaths function
 */
test('test jetPaths function and baseKey option', () => {
  // Test the basics
  const pathsFull = jetPaths(PATHS);
  expect(pathsFull.Users.Add()).toStrictEqual('/api/users/add');
  expect(pathsFull.Posts.Delete({ id: '5' })).toStrictEqual(
    '/api/posts/delete/5',
  );

  expect(pathsFull.Posts.Delete({ id: -5 })).toStrictEqual(
    '/api/posts/delete/-5',
  );
  expect(pathsFull.Posts()).toStrictEqual('/api/posts');
  expect(pathsFull.Posts._).toStrictEqual('/posts');
  expect(pathsFull.Posts.Misc({ id: 67, foo: 'bar' })).toStrictEqual(
    '/api/posts/misc/67/something/bar',
  );
  expect(pathsFull.Posts.Misc({ id: -67, foo: 'bar' })).toStrictEqual(
    '/api/posts/misc/-67/something/bar',
  );
  expect(() =>
    // @ts-expect-error - "foo" is not a path param
    pathsFull.Posts.Else({ foo: 'bar', id: 34 }),
  ).toThrowError();
  expect(pathsFull.Posts.Misc()).toStrictEqual(
    '/api/posts/misc/:id/something/:foo',
  );
  // Test SearchParams
  interface ISearchParams {
    q: string;
  }
  const searchParams: ISearchParams = { q: 'blah' };
  expect(
    pathsFull.Posts.Other({ id: 5, name: 'n' }, searchParams),
  ).toStrictEqual('/api/posts/other/5/blah/n?q=blah');
});

/**
 * Test jetPaths prepending
 */
test('test jetPaths prepending', () => {
  const paths = jetPaths(PATHS_2, {
    prepend: 'localhost:3000',
  });
  expect(paths.Users.Add()).toStrictEqual('localhost:3000/api/users/add');
  expect(paths.Users.One({ id: 5 })).toStrictEqual(
    'localhost:3000/api/users/5',
  );
  // @ts-expect-error - unknown key
  expect(() => paths.Users.Delete({ id: 5, foo: 'bar' })).toThrowError();
});

/**
 * Test more jetPaths prepending
 */
test('test more jetPaths prepending', () => {
  const PREPEND: string = 'localhost:3000';
  const paths = jetPaths(PATHS_3, { prepend: PREPEND });
  expect(paths.Users.Add()).toStrictEqual('localhost:3000/api/users/add');
  expect(paths.Users.One({ id: 5 })).toStrictEqual(
    'localhost:3000/api/users/5',
  );
  expect(paths.Users.One({ id: null })).toStrictEqual(
    'localhost:3000/api/users/null',
  );
  expect(paths.Users.Delete({ id: 5 })).toStrictEqual(
    'localhost:3000/api/users/delete/5',
  );
  // @ts-expect-error - unknown key
  expect(() => paths.Users.Delete({ id: 5, foo: 'bar' })).toThrowError();
});

/**
 * Test error catching
 */
test('test error catching', () => {
  interface PathParams {
    id: number;
    name: string;
  }

  const pathParams: PathParams = { id: 5, name: 'john' };
  const pathsFull = jetPaths(PATHS);
  expect(() => pathsFull.Posts.Other(pathParams)).not.toThrowError();
  // @ts-expect-error - wrong key name
  expect(() => pathsFull.Posts.Other({ idd: 5, name: 'bar' })).toThrowError();
  expect(() =>
    // @ts-expect-error - extra key
    pathsFull.Posts.Other({ id: 5, name: 'john', age: 5 }),
  ).toThrowError();
  // @ts-expect-error - missing key
  expect(() => pathsFull.Posts.Other({ id: 5 })).toThrowError();
  // Special characters are encoded instead of throwing
  expect(pathsFull.Posts.Other({ id: 5, name: 'bar 62 23*(&^' })).toStrictEqual(
    '/api/posts/other/5/blah/bar%2062%2023*(%26%5E',
  );
  expect(pathsFull.Posts.Misc({ id: '- 67', foo: 'bar' })).toStrictEqual(
    '/api/posts/misc/-%2067/something/bar',
  );
  // Invalid SearchParams (nested object)
  expect(() =>
    pathsFull.Posts.Other({ id: 5, name: 'n' }, {
      q: { woof: 'bar' },
    } as any),
  ).toThrowError(/must be a primitive or an array of primitives/);
});

/**
 * Test inserting `searchParams`
 */
test('appending search params', () => {
  const pathsFull = jetPaths(PATHS_4);
  // Basic test
  const formattedURL = pathsFull.Users.Search({ name: 'foo', email: 'bar' });
  expect(formattedURL).toStrictEqual('/api/users/search?name=foo&email=bar');
  // Test id
  const url = pathsFull.Users.Search({ name: 'foo', ids: [1, 2, 3] });
  expect(url).toStrictEqual('/api/users/search?name=foo&ids=1&ids=2&ids=3');
});
