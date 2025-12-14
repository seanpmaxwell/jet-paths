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
    Private: {
      _: '/private',
      Get: '/all',
      Delete: '/delete/:id',
    },
  },
  Foo: '/foo'
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
  expect(pathsFull.Users.Add).toStrictEqual('/api/users/add');
  expect(pathsFull.Posts.Delete({ id: 5, foo: 'bar' })).toStrictEqual('/api/posts/delete/5');
  expect(pathsFull.Posts._).toStrictEqual('/api/posts');
  expect(pathsFull.Posts.Misc({ id: 67, foo: 'bar' })).toStrictEqual('/api/posts/misc/67/something/bar');
  expect(pathsFull.Posts.Else({ foo: 'bar', id: 34 })).toStrictEqual('/api/posts/else/34/something/foo');
  expect(pathsFull.Posts.Misc()).toStrictEqual('/api/posts/misc/:id/something/:foo');
  // Test strict key check here
  // pick up here
});

/**
 * Test insertUrlParams functions
 */
test('test insertUrlParams function', () => {
  const result1 = insertUrlParams('/api/users/:id')(7),
    result2 = insertUrlParams('api/post/:name/:id')({ name: 'steve', id: 1 }),
    result3 = insertUrlParams('/api/post/:name/:id')('foo');
  expect(result1).toStrictEqual('/api/users/7');
  expect(result2).toStrictEqual('api/post/steve/1');
  expect(result3).toStrictEqual('/api/post/foo/foo');
});

/**
 * Test jetPaths prepending
 */
test('test insertUrlParams function', () => {
  const paths = jetPaths({
    _: '/api',
    Users: {
      _: '/users',
      Get: '/all',
      One: '/:id',
      Add: '/add',
      Update: '/update',
      Delete: '/delete/:id',
    },
  }, { prepend: 'localhost:3000' });
  expect(paths.Users.Add).toStrictEqual('localhost:3000/api/users/add');
  expect(paths.Users.One(5)).toStrictEqual('localhost:3000/api/users/5');
  expect(paths.Users.Delete({ id: 5, foo: 'bar' }))
    .toStrictEqual('localhost:3000/api/users/delete/5');
});

/**
 * Test more jetPaths prepending
 */
test('test more insertUrlParams function', () => {
  const PREPEND: string = 'localhost:3000';
  const paths = jetPaths({
    _: '/api',
    Users: {
      _: '/users',
      Get: '/all',
      One: '/:id',
      Add: '/add',
      Update: '/update',
      Delete: '/delete/:id',
    },
  }, { prepend: PREPEND });
  expect(paths.Users.Add).toStrictEqual('localhost:3000/api/users/add');
  expect(paths.Users.One(5)).toStrictEqual('localhost:3000/api/users/5');
    expect(paths.Users.One(null)).toStrictEqual('localhost:3000/api/users/null');
  expect(paths.Users.Delete({ id: 5, foo: 'bar' }))
    .toStrictEqual('localhost:3000/api/users/delete/5');
});
