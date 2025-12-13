import { expect, test } from 'vitest';
import jetPaths, { insertUrlParams } from '../src';

/******************************************************************************
                               Constants
******************************************************************************/

const PREFIX = 'Base';

const PATHS = {
  [PREFIX]: '/api',
  Users: {
    [PREFIX]: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Posts: {
    [PREFIX]: '/posts',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    Misc: '/misc/:id/something/:foo',
    Else: '/else/:id/something/foo',
    Private: {
      [PREFIX]: '/private',
      Get: '/all',
      Delete: '/delete/:id',
    },
  },
} as const;

const PATHS_2 = {
  Root: '/api',
  Users: {
    Root: '/users',
    Get: '/all',
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
  const pathsFull = jetPaths(PATHS, { baseKey: PREFIX });
  expect(pathsFull.Users.Add).toStrictEqual('/api/users/add');
  expect(pathsFull.Posts.Delete({ id: 5, foo: 'bar' })).toStrictEqual('/api/posts/delete/5');
  expect(pathsFull.Posts.Misc({ id: 67, foo: 'bar' })).toStrictEqual('/api/posts/misc/67/something/bar');
  expect(pathsFull.Posts.Else({ foo: 'bar', id: 34 })).toStrictEqual('/api/posts/else/34/something/foo');
  expect(pathsFull.Posts.Misc()).toStrictEqual('/api/posts/misc/:id/something/:foo');
  const pathsFull2 = jetPaths(PATHS_2);
  expect(pathsFull2.Users.Delete({ id: 5, foo: 'bar' })).toStrictEqual('/api/users/delete/5');
});

/**
 * Test jetPaths function
 */
test('test insertUrlParams function', () => {
  const result1 = insertUrlParams('/api/users/:id')(7),
    result2 = insertUrlParams('api/post/:name/:id')({ name: 'steve', id: 1 }),
    result3 = insertUrlParams('/api/post/:name/:id')('foo');
  expect(result1).toStrictEqual('/api/users/7');
  expect(result2).toStrictEqual('api/post/steve/1');
  expect(result3).toStrictEqual('/api/post/foo/foo');
});
