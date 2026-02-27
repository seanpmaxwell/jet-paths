import { expect, test } from 'vitest';

import jetPaths, { formatURL } from '../src';

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
    Search: '/search?name={}&email={}',
  },
} as const;

// Should throw error
const PATHS_5 = {
  _: 'api',
  Users: '/search?',
} as const;

/******************************************************************************
                               Functions
******************************************************************************/

/**
 * Test jetPaths function
 */
test('test jetPaths function and baseKey option', () => {
  // Test the basics
  const pathsFull = jetPaths(PATHS, { strictKeyNames: false });
  expect(pathsFull.Users.Add).toStrictEqual('/api/users/add');
  expect(pathsFull.Posts.Delete({ id: 5, foo: 'bar' })).toStrictEqual(
    '/api/posts/delete/5',
  );
  expect(pathsFull.Posts._).toStrictEqual('/api/posts');
  expect(pathsFull.Posts.Misc({ id: 67, foo: 'bar' })).toStrictEqual(
    '/api/posts/misc/67/something/bar',
  );
  expect(pathsFull.Posts.Else({ foo: 'bar', id: 34 })).toStrictEqual(
    '/api/posts/else/34/something/foo',
  );
  expect(pathsFull.Posts.Misc()).toStrictEqual(
    '/api/posts/misc/:id/something/:foo',
  );
});

/**
 * Test .formatURL functions
 */
test('test .formatURL function', () => {
  const insert1 = formatURL('/api/users/:id', { strictKeyNames: false }),
    insert2 = formatURL('/api/post/:name/:id', { strictKeyNames: false }),
    insert3 = formatURL('/api/post/:name/:id', { strictKeyNames: false });
  expect(insert1({ id: 7 })).toStrictEqual('/api/users/7');
  expect(insert2({ name: 'steve', id: 1 })).toStrictEqual('/api/post/steve/1');
  expect(insert3()).toStrictEqual('/api/post/:name/:id');
  const resp = () => formatURL('api/post/:name/:id', { strictKeyNames: false });
  expect(() => resp()).toThrowError();
});

/**
 * Test jetPaths prepending
 */
test('test jetPaths prepending', () => {
  const paths = jetPaths(PATHS_2, {
    prepend: 'localhost:3000',
    strictKeyNames: false,
  });
  expect(paths.Users.Add).toStrictEqual('localhost:3000/api/users/add');
  expect(paths.Users.One({ id: 5 })).toStrictEqual(
    'localhost:3000/api/users/5',
  );
  expect(paths.Users.Delete({ id: 5, foo: 'bar' })).toStrictEqual(
    'localhost:3000/api/users/delete/5',
  );
});

/**
 * Test more jetPaths prepending
 */
test('test more jetPaths prepending', () => {
  const PREPEND: string = 'localhost:3000';
  const paths = jetPaths(PATHS_3, { prepend: PREPEND, strictKeyNames: false });
  expect(paths.Users.Add).toStrictEqual('localhost:3000/api/users/add');
  expect(paths.Users.One({ id: 5 })).toStrictEqual(
    'localhost:3000/api/users/5',
  );
  expect(paths.Users.One({ id: null })).toStrictEqual(
    'localhost:3000/api/users/null',
  );
  expect(paths.Users.Delete({ id: 5, foo: 'bar' })).toStrictEqual(
    'localhost:3000/api/users/delete/5',
  );
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
  const pathsCustomRegex = jetPaths(PATHS);
  expect(() =>
    pathsCustomRegex.Posts.Other({ id: 5, name: 'bar 62 23*(&^' }),
  ).toThrowError();
});

/**
 * Test inserting `searchParams`
 */
test('appending search params', () => {
  const pathsFull = jetPaths(PATHS_4);

  // pick up here

  // Basic test
  const formattedURL = pathsFull.Users.Search({ name: 'foo', email: 'bar' });
  expect(formattedURL).toStrictEqual('/api/users/search?name=foo&email=bar');
  expect(() => jetPaths(PATHS_5)).toThrowError();
});

// pick up here, make sure legacy stuff still works first

// pick up here, use these for some regex testing
// regex.test('/api/:search')
// regex.test('api/:search')
// regex.test('/api/:search/?')
// regex.test('/api/:search/:foo?')
// regex.test('/api/:search/:foo?search={}')
// regex.test('/api/:search/:foo?search={}name={}')
// regex.test('/api/:search/:foo?search={}&name={}')
