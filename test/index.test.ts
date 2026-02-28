import { expect, test } from 'vitest';

import jetPaths from '../src';

/******************************************************************************
                               Constants
******************************************************************************/

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

/******************************************************************************
                               Functions
******************************************************************************/

/**
 * Test jetPaths function
 */
test('test jetPaths function and baseKey option', () => {
  // Test the basics
  const pathsFull = jetPaths(PATHS);
  expect(pathsFull.Users.Add()).toStrictEqual('/api/users/add');
  expect(pathsFull.Posts.Delete({ id: 5 })).toStrictEqual(
    '/api/posts/delete/5',
  );
  expect(pathsFull.Posts._).toStrictEqual('/api/posts');
  expect(pathsFull.Posts.Misc({ id: 67, foo: 'bar' })).toStrictEqual(
    '/api/posts/misc/67/something/bar',
  );
  expect(() => pathsFull.Posts.Else({ foo: 'bar', id: 34 })).toThrowError();
  expect(pathsFull.Posts.Misc()).toStrictEqual(
    '/api/posts/misc/:id/something/:foo',
  );
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
  expect(() => paths.Users.Delete({ id: 5, foo: 'bar' })).toThrowError();
});

/**
 * Test error catching
 */
test('test error catching', () => {
  const pathsFull = jetPaths(PATHS);
  expect(() =>
    pathsFull.Posts.Other({ id: 5, name: 'john' }),
  ).not.toThrowError();
  expect(() => pathsFull.Posts.Other({ idd: 5, name: 'bar' })).toThrowError();
  expect(() =>
    pathsFull.Posts.Other({ id: 5, name: 'bar 62 23*(&^' }),
  ).toThrowError();
  expect(() =>
    pathsFull.Posts.Other({ id: 5, name: 'john', age: 5 }),
  ).toThrowError();
  expect(() => pathsFull.Posts.Other({ id: 5 })).toThrowError();
  const pathsDisableRegex = jetPaths(PATHS, { disableRegex: true });
  expect(
    pathsDisableRegex.Posts.Other({ id: 5, name: 'bar 62 23*(&^' }),
  ).toStrictEqual('/api/posts/other/5/blah/bar 62 23*(&^');
});

/**
 * Test inserting `searchParams`
 */
test('appending search params', () => {
  const pathsFull = jetPaths(PATHS_4);
  const formattedURL = pathsFull.Users.Search({ name: 'foo', email: 'bar' });
  expect(formattedURL).toStrictEqual('/api/users/search?name=foo&email=bar');
  const url = pathsFull.Users.Search({ name: 'foo', ids: [1, 2, 3] });
  expect(url).toStrictEqual('/api/users/search?name=foo&ids=[1,2,3]');
});

const Paths = jetPaths(
  {
    _: '/api',
    Users: {
      _: '/users',
      Add: '/add',
      Delete: '/delete/:id',
    },
  },
  { prepend: 'localhost:3000' },
);

Paths.Users.Add();
