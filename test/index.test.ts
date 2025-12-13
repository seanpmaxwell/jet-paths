import { expect, test } from 'vitest';
import jetPaths, { insertUrlParams } from '../src';

/******************************************************************************
                               Constants
******************************************************************************/

const PATHS = {
  base: '/api',
  Users: {
    base: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Posts: {
    base: '/posts',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    Misc: '/misc/:id/something/:foo',
    Else: '/else/:id/something/foo',
    Private: {
      base: '/private',
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
  const pathsFull = jetPaths(PATHS);
  expect(pathsFull.Users.Add).toStrictEqual('/api/users/add');
  expect(pathsFull.Posts.Delete({ id: 5, foo: 'bar' })).toStrictEqual('/api/posts/delete/5');
  expect(pathsFull.Posts.Misc({ id: 67, foo: 'bar' })).toStrictEqual('/api/posts/misc/67/something/bar');
  expect(pathsFull.Posts.Else({ foo: 'bar', id: 34 })).toStrictEqual('/api/posts/else/34/something/foo');
  expect(pathsFull.Posts.Misc()).toStrictEqual('/api/posts/misc/:id/something/:foo');
  const pathsFull2 = jetPaths({
    base: '/api',
    Users: {
      base: '/users',
      Get: '/all',
      Add: '/add',
      Update: '/update',
      Delete: '/delete/:id',
    },
  });
  expect(pathsFull2.Users.Delete({ id: 5, foo: 'bar' })).toStrictEqual('/api/users/delete/5');
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
 * Test jetPaths function
 */
test('test insertUrlParams function', () => {
  const pathsFull = jetPaths(PATHS, { prepend: 'localhost:3000' });
  expect(pathsFull.Users.Add).toStrictEqual('localhost:3000/api/users/add');
});
