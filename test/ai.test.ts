import { describe, expect, test } from 'vitest';

import jetPaths from '../src';

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

    expect(paths._).toBe('/api');
    expect(paths.V1._).toBe('/api/v1');
    expect(paths.V1.Users._).toBe('/api/v1/users');
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

    expect(() => paths.Two({ id: 1 })).toThrowError(
      /number of keys on the value object/i,
    );
    expect(() => paths.Two({ id: 1, slug: 'a', extra: 'x' })).toThrowError(
      /number of keys on the value object/i,
    );
  });

  test('throws when a required path key is missing', () => {
    const paths = jetPaths({
      _: '/api',
      Two: '/:id/:slug',
    });

    expect(() => paths.Two({ id: 1, name: 'abc' })).toThrowError(
      /"slug" was not present/,
    );
  });

  test('serializes search params for primitives, objects, arrays, and Date', () => {
    const paths = jetPaths({
      _: '/api',
      Search: '/search',
    });
    const date = new Date('2024-01-02T03:04:05.000Z');

    const url = paths.Search({
      q: 'foo',
      page: 2,
      active: false,
      tags: ['a', 1],
      meta: { role: 'admin' },
      when: date,
      none: undefined,
      n: null,
    });

    expect(url).toBe(
      '/api/search?q=foo&page=2&active=false&tags=["a",1]&meta={"role":"admin"}&when="2024-01-02T03:04:05.000Z"&none=undefined&n=null',
    );
  });

  test('does not append a query string when search object is empty', () => {
    const paths = jetPaths({
      _: '/api',
      Search: '/search',
    });

    expect(paths.Search({})).toBe('/api/search');
  });

  test('validates URL format by default', () => {
    const paths = jetPaths({
      _: '/api',
      Users: {
        _: '/users',
        One: '/:id',
      },
      Search: '/search',
    });

    expect(() => paths.Users.One({ id: 'bad value' })).toThrowError(
      /failed to pass validation/i,
    );
    expect(() => paths.Search({ bad_key: 'x' })).toThrowError(
      /failed to pass validation/i,
    );
  });

  test('bypasses URL validation when disableRegex=true', () => {
    const paths = jetPaths(
      {
        _: '/api',
        Users: {
          _: '/users',
          One: '/:id',
        },
        Search: '/search',
      },
      { disableRegex: true },
    );

    expect(paths.Users.One({ id: 'bad value*&' })).toBe('/api/users/bad value*&');
    expect(paths.Search({ bad_key: 'x' })).toBe('/api/search?bad_key=x');
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
      /base key must exist/i,
    );
  });

  test('throws when nested base key is missing or invalid', () => {
    expect(
      () =>
        jetPaths({
          _: '/api',
          Users: {
            Add: '/add',
          },
        } as any),
    ).toThrowError(/base key must exist/i);

    expect(
      () =>
        jetPaths({
          _: '/api',
          Users: {
            _: 123,
            Add: '/add',
          },
        } as any),
    ).toThrowError(/base key must exist/i);
  });

  test('throws when nested non-object route values recurse into invalid shapes', () => {
    expect(
      () =>
        jetPaths({
          _: '/api',
          Bad: [],
        } as any),
    ).toThrowError(/base key must exist/i);
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
});
