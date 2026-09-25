import { describe, expect, test } from 'vitest';

import jetPaths from '../../src/index.js';

// ========================================================================= //
//                                   TESTS                                   //
// ========================================================================= //

describe('jetPaths edge cases', () => {
  test('builds nested base paths and static routes', () => {
    const paths = jetPaths({
      _: '/api',
      V1: {
        _: '/v1',
        Users: {
          _: '/users',
          One: '/:id',
          Settings: '/settings/:tab',
        },
      },
      Health: '/health',
    });

    expect(paths()).toBe('/api');
    expect(paths.V1()).toBe('/api/v1');
    expect(paths.V1.Users()).toBe('/api/v1/users');
    expect(paths.Health()).toBe('/api/health');
    expect(paths.V1.Users.One({ id: 42 })).toBe('/api/v1/users/42');
    expect(paths.V1.Users.Settings({ tab: 'profile' })).toBe(
      '/api/v1/users/settings/profile',
    );
  });

  test('converts primitive path values to strings', () => {
    const paths = jetPaths({
      _: '/api',
      Flags: '/flags/:enabled/:tag/:optional',
    });

    expect(
      paths.Flags({
        enabled: false,
        tag: null,
        optional: undefined,
      }),
    ).toBe('/api/flags/false/null/undefined');
  });

  test('returns the unformatted path when path values are omitted', () => {
    const paths = jetPaths({
      _: '/api',
      Users: {
        _: '/users',
        One: '/:id',
      },
    });

    expect(paths.Users.One()).toBe('/api/users/:id');
    expect(paths.Users.One(undefined, { expand: true })).toBe(
      '/api/users/:id?expand=true',
    );
  });

  test('throws when path value count does not match URL params', () => {
    const paths = jetPaths({
      _: '/api',
      Two: '/:id/:slug',
    });

    expect(() => paths.Two({ id: 1 } as any)).toThrowError(
      /number of keys on the value object/i,
    );
    expect(() =>
      paths.Two({ id: 1, slug: 'a', extra: 'x' } as any),
    ).toThrowError(/number of keys on the value object/i);
  });

  test('throws when a required path key is missing', () => {
    const paths = jetPaths({
      _: '/api',
      Two: '/:id/:slug',
    });

    expect(() => paths.Two({ id: 1, name: 'abc' } as any)).toThrowError(
      /"slug" was not present/,
    );
  });

  test('serializes search params for primitives, arrays, null, and undefined', () => {
    const paths = jetPaths({
      _: '/api',
      Search: '/search',
    });

    const url = paths.Search({
      q: 'foo',
      page: 2,
      active: false,
      tags: ['a', 1, undefined],
      none: undefined,
      n: null,
    });

    expect(url).toBe(
      '/api/search?q=foo&page=2&active=false&tags=a&tags=1&n=null',
    );
  });

  test('throws for search values which are objects (including Date)', () => {
    const paths = jetPaths({
      _: '/api',
      Search: '/search',
    });

    expect(() => paths.Search({ meta: { role: 'admin' } } as any)).toThrowError(
      /"meta" must be a primitive/,
    );
    expect(() => paths.Search({ when: new Date() } as any)).toThrowError(
      /"when" must be a primitive/,
    );
    expect(() => paths.Search({ fn: () => 1 } as any)).toThrowError(
      /"fn" must be a primitive/,
    );
    expect(() => paths.Search({ ids: [[1]] } as any)).toThrowError(
      /"ids" must be a primitive/,
    );
    expect(() => paths.Search('q=1' as any)).toThrowError(
      /search params must be an object/i,
    );
  });

  test('skips inherited properties on search params', () => {
    const paths = jetPaths({ _: '/api', Search: '/search' });
    class Query {
      public a = 1;
    }
    Object.assign(Query.prototype, { inherited: 2 });

    expect(paths.Search(new Query())).toBe('/api/search?a=1');
  });

  test('encodes search keys and values so they cannot inject params', () => {
    const paths = jetPaths({ _: '/api', Search: '/search' });

    expect(paths.Search({ q: 'a&admin=true' })).toBe(
      '/api/search?q=a%26admin%3Dtrue',
    );
    expect(paths.Search({ q: 'hello world#top' })).toBe(
      '/api/search?q=hello%20world%23top',
    );
    expect(paths.Search({ page_size: 10, 'a b': 'ü' })).toBe(
      '/api/search?page_size=10&a%20b=%C3%BC',
    );
  });

  test('does not append a query string when search object is empty', () => {
    const paths = jetPaths({
      _: '/api',
      Search: '/search',
    });

    expect(paths.Search({})).toBe('/api/search');
  });

  test('encodes path values', () => {
    const paths = jetPaths({
      _: '/api',
      Users: {
        _: '/users',
        One: '/:id',
      },
    });

    expect(paths.Users.One({ id: 'bad value' })).toBe('/api/users/bad%20value');
    expect(paths.Users.One({ id: '../../admin' })).toBe(
      '/api/users/..%2F..%2Fadmin',
    );
    expect(paths.Users.One({ id: 'a?b#c' })).toBe('/api/users/a%3Fb%23c');
  });

  test('accepts common real-world ids', () => {
    const paths = jetPaths({
      _: '/api',
      Users: {
        _: '/users',
        One: '/:id',
      },
    });

    expect(
      paths.Users.One({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    ).toBe('/api/users/550e8400-e29b-41d4-a716-446655440000');
    expect(paths.Users.One({ id: 'john_doe' })).toBe('/api/users/john_doe');
    expect(paths.Users.One({ id: 1.5 })).toBe('/api/users/1.5');
    expect(paths.Users.One({ id: -5 })).toBe('/api/users/-5');
  });

  test('throws for path values which would change the url structure', () => {
    const paths = jetPaths({
      _: '/api',
      Users: {
        _: '/users',
        One: '/:id',
      },
    });

    for (const id of ['', '.', '..']) {
      expect(() => paths.Users.One({ id })).toThrowError(
        /path value for "id"/i,
      );
    }
    expect(() => paths.Users.One({ id: { a: 1 } } as any)).toThrowError(
      /path value for "id"/i,
    );
    expect(() => paths.Users.One('5' as any)).toThrowError(
      /path params must be an object/i,
    );
  });

  test('validates route templates at setup', () => {
    const invalid = [
      { _: '/api', A: 'a' },
      { _: '/api', A: '/user profile' },
      { _: '/api', A: '/a?b=1' },
      { _: '/api', A: '/a/../b' },
      { _: '/api', A: '/:id.json' },
      { _: '/api', A: '' },
      { _: 'api', A: '/a' },
      { _: '/', A: '/a' },
      { _: '/api', Users: { _: 'users', A: '/a' } },
    ];
    for (const routes of invalid) {
      expect(() => jetPaths(routes as any)).toThrowError(
        /failed to pass validation/i,
      );
    }
    expect(() => jetPaths({ _: '/api', A: 'a' } as any)).toThrowError(
      'Key path: "A", URL: "a"',
    );
    expect(() =>
      jetPaths({ _: '/api', Users: { _: 'users' } } as any),
    ).toThrowError('Key path: "Users._"');
  });

  test('allows valid route templates', () => {
    const paths = jetPaths({
      _: '',
      Kebab: '/user-profile',
      Dots: '/v1.0/file.json',
      Tilde: '/~me',
      Escaped: '/a%20b',
      Slash: '/',
      Users: {
        _: '/users',
        One: '/:user_id/',
      },
    });

    expect(paths()).toBe('');
    expect(paths.Kebab()).toBe('/user-profile');
    expect(paths.Dots()).toBe('/v1.0/file.json');
    expect(paths.Tilde()).toBe('/~me');
    expect(paths.Escaped()).toBe('/a%20b');
    expect(paths.Slash()).toBe('/');
    expect(paths.Users.One({ user_id: 5 })).toBe('/users/5/');
  });

  test('keeps trailing slashes when inserting path values', () => {
    const paths = jetPaths({ _: '/api', One: '/:id/' });

    expect(paths.One()).toBe('/api/:id/');
    expect(paths.One({ id: 5 })).toBe('/api/5/');
  });

  test('inserts the same value for repeated param names', () => {
    const paths = jetPaths({ _: '/api', Dup: '/:id/x/:id' });

    expect(paths.Dup({ id: 5 })).toBe('/api/5/x/5');
  });

  test('skips template validation when disableRegex=true', () => {
    const paths = jetPaths(
      {
        _: '/api',
        Users: {
          _: '/users',
          One: '/:id',
        },
        Odd: '/a b',
      },
      { disableRegex: true },
    );

    expect(paths.Odd()).toBe('/api/a b');
    // Values are still encoded
    expect(paths.Users.One({ id: 'bad value*&' })).toBe(
      '/api/users/bad%20value*%26',
    );
    expect(paths.Users.One({ id: '../../admin' })).toBe(
      '/api/users/..%2F..%2Fadmin',
    );
  });

  test('applies prepend after validation', () => {
    const paths = jetPaths(
      {
        _: '/api',
        Users: {
          _: '/users',
          One: '/:id',
        },
      },
      { prepend: 'http://bad host' },
    );

    expect(paths.Users.One({ id: 1 })).toBe('http://bad host/api/users/1');
  });

  test('throws when root base key is missing', () => {
    expect(() => jetPaths({ Users: { _: '/users' } } as any)).toThrowError(
      'Key path: "(root)"',
    );
  });

  test('throws when nested base key is missing or invalid', () => {
    expect(() =>
      jetPaths({
        _: '/api',
        Users: {
          Add: '/add',
        },
      } as any),
    ).toThrowError(/base key "_" must exist/i);

    expect(() =>
      jetPaths({
        _: '/api',
        Users: {
          _: 123,
          Add: '/add',
        },
      } as any),
    ).toThrowError('Key path: "Users"');
  });

  test('throws for route values which are not strings or plain objects', () => {
    for (const value of [[], null, 5, true]) {
      expect(() => jetPaths({ _: '/api', Bad: value } as any)).toThrowError(
        'Route values must be a string or a plain object. Key path: "Bad".',
      );
    }
    expect(() =>
      jetPaths({ _: '/api', Users: { _: '/users', Bad: null } } as any),
    ).toThrowError('Key path: "Users.Bad"');
  });

  test('treats first argument as search params for static routes', () => {
    const paths = jetPaths({
      _: '/api',
      Users: {
        _: '/users',
        Add: '/add',
      },
    });

    expect(paths.Users.Add({ role: 'admin', page: 2 })).toBe(
      '/api/users/add?role=admin&page=2',
    );
  });

  test('every function has "_" set to the original partial path', () => {
    const paths = jetPaths(
      {
        _: '/api',
        Users: {
          _: '/users',
          Get: '/all',
          One: '/:id',
        },
      },
      { prepend: 'localhost:3000' },
    );

    expect(paths._).toBe('/api');
    expect(paths.Users._).toBe('/users');
    expect(paths.Users.Get._).toBe('/all');
    expect(paths.Users.One._).toBe('/:id');
    expect(paths.Users()).toBe('localhost:3000/api/users');
    expect(paths.Users.One({ id: 5 })).toBe('localhost:3000/api/users/5');
  });

  test('group functions accept path params and search params', () => {
    const paths = jetPaths({
      _: '/api',
      User: {
        _: '/users/:userId',
        Posts: '/posts',
      },
    });

    expect(paths.User({ userId: 7 }, { page: 2 })).toBe('/api/users/7?page=2');
    expect(paths.User.Posts({ userId: 7 })).toBe('/api/users/7/posts');
  });

  test('allows keys which collide with built-in function properties', () => {
    const paths = jetPaths({
      _: '/api',
      name: '/name',
      length: {
        _: '/length',
        Get: '/all',
      },
    });

    expect(paths.name()).toBe('/api/name');
    expect(paths.length()).toBe('/api/length');
    expect(paths.length.Get()).toBe('/api/length/all');
  });
});
