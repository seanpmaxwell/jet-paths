/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { expect, test } from 'vitest';

import jetPaths from '@src/index';

test('generated URLs preserve path and query values in a real browser', () => {
  expect(globalThis).toHaveProperty('window', globalThis);
  expect(globalThis).toHaveProperty('document');

  const paths = jetPaths(
    { _: '/api', Users: { _: '/users', One: '/:id' } },
    { prepend: 'https://example.test' },
  );
  const url = new URL(
    paths.Users.One(
      { id: 'a/b?c#ü' },
      {
        q: 'a&admin=true#fragment',
        tags: ['one', 'two'],
        skip: undefined,
        empty: null,
      },
    ),
  );

  expect(url.origin).toBe('https://example.test');
  expect(url.pathname).toBe('/api/users/a%2Fb%3Fc%23%C3%BC');
  expect(url.hash).toBe('');
  expect([...url.searchParams]).toEqual([
    ['q', 'a&admin=true#fragment'],
    ['tags', 'one'],
    ['tags', 'two'],
    ['empty', 'null'],
  ]);
});

test('relative routes resolve against a browser URL without losing query values', () => {
  const paths = jetPaths({ _: '/api', Search: '/search' });
  const url = new URL(
    paths.Search({ q: 'hello world', active: false, page: 2 }),
    'https://example.test/app/',
  );

  expect(url.origin).toBe('https://example.test');
  expect(url.pathname).toBe('/api/search');
  expect([...url.searchParams]).toEqual([
    ['q', 'hello world'],
    ['active', 'false'],
    ['page', '2'],
  ]);
});
