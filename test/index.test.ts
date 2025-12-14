import { expect, test } from 'vitest';
import jetPaths, { insertUrlParams } from '../src';

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
  Foo: '/foo'
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
  expect(pathsFull.Posts.Delete({ id: 5, foo: 'bar' })).toStrictEqual('/api/posts/delete/5');
  expect(pathsFull.Posts._).toStrictEqual('/api/posts');
  expect(pathsFull.Posts.Misc({ id: 67, foo: 'bar' })).toStrictEqual('/api/posts/misc/67/something/bar');
  expect(pathsFull.Posts.Else({ foo: 'bar', id: 34 })).toStrictEqual('/api/posts/else/34/something/foo');
  expect(pathsFull.Posts.Misc()).toStrictEqual('/api/posts/misc/:id/something/:foo');
});

/**
 * Test insertUrlParams functions
 */
test('test insertUrlParams function', () => {
  const insert1 = insertUrlParams('/api/users/:id', { strictKeyNames: false }),
    insert2 = insertUrlParams('api/post/:name/:id', { strictKeyNames: false }),
    insert3 = insertUrlParams('/api/post/:name/:id', { strictKeyNames: false });
  expect(insert1(7)).toStrictEqual('/api/users/7');
  expect(insert2({ name: 'steve', id: 1 })).toStrictEqual('api/post/steve/1');
  expect(insert3('foo')).toStrictEqual('/api/post/foo/foo');
});

/**
 * Test jetPaths prepending
 */
test('test insertUrlParams function', () => {
  const paths = jetPaths(PATHS_2, {
    prepend: 'localhost:3000',
    strictKeyNames: false,
  });
  expect(paths.Users.Add).toStrictEqual('localhost:3000/api/users/add');
  expect(paths.Users.One(5)).toStrictEqual('localhost:3000/api/users/5');
  expect(paths.Users.Delete({ id: 5, foo: 'bar' }))
    .toStrictEqual('localhost:3000/api/users/delete/5');
});

/**
 * Test more jetPaths prepending
 */
test('test insertUrlParams function with prepend options', () => {
  const PREPEND: string = 'localhost:3000';
  const paths = jetPaths(PATHS_3, { prepend: PREPEND, strictKeyNames: false });
  expect(paths.Users.Add).toStrictEqual('localhost:3000/api/users/add');
  expect(paths.Users.One(5)).toStrictEqual('localhost:3000/api/users/5');
    expect(paths.Users.One(null)).toStrictEqual('localhost:3000/api/users/null');
  expect(paths.Users.Delete({ id: 5, foo: 'bar' }))
    .toStrictEqual('localhost:3000/api/users/delete/5');
});

/**
 * Test error catching
 */
test.only('test jetPaths function and baseKey option', () => {
  const pathsFull = jetPaths(PATHS, { regex: true });
  expect(() => pathsFull.Posts.Other({ id: 5, name: 'john' })).not.toThrowError();
  expect(() => pathsFull.Posts.Other({ idd: 5, name: 'bar' })).toThrowError();
  expect(() => pathsFull.Posts.Other({ id: 5, foo: 'bar 62 23*(&^' })).toThrowError();
  expect(() => pathsFull.Posts.Other({ id: 5, name: 'john', age: 5 })).toThrowError();
  expect(() => pathsFull.Posts.Other({ id: 5 })).toThrowError();
});

