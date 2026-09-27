import { describe, expect, test } from 'vitest';

import jetPaths from '@src/index';

// ========================================================================= //
//                                   TESTS                                   //
// ========================================================================= //

describe('jetPaths edge cases', () => {
  test('builds nested base paths and static routes', () => {
    const paths = jetPaths({
      $path: '/api',
      V1: {
        $path: '/v1',
        Users: {
          $path: '/users',
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
      $path: '/api',
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

  test('insertion functions always require the path params', () => {
    const paths = jetPaths({
      $path: '/api',
      Users: {
        $path: '/users',
        One: '/:id',
      },
    });

    expect(paths.Users.One.$tmpl).toBe('/api/users/:id');
    // @ts-expect-error - the path params are required
    expect(() => paths.Users.One()).toThrowError(
      'Path params must be an object. Path "/api/users/:id". Use "$tmpl" ' +
        'for the path template.',
    );
    expect(() => paths.Users.One(undefined as any)).toThrowError(
      /path params must be an object/i,
    );
    expect(() =>
      paths.Users.One(undefined as any, { expand: true }),
    ).toThrowError(/path params must be an object/i);
    expect(paths.Users.One({ id: 5 }, { expand: true })).toBe(
      '/api/users/5?expand=true',
    );
  });

  test('non-insertion functions: no arguments returns the url', () => {
    const paths = jetPaths({
      $path: '/api',
      Users: {
        $path: '/users',
        Get: '/all',
      },
    });

    expect(paths.Users.Get()).toBe('/api/users/all');
    expect(paths.Users()).toBe('/api/users');
    expect(paths()).toBe('/api');
    // Any other call must pass the search params, even a missing variable
    expect(() => paths.Users.Get(undefined as any)).toThrowError(
      /search params must be an object/i,
    );
    expect(paths.Users.Get({})).toBe('/api/users/all');
    expect(paths.Users.Get({ page: 2 })).toBe('/api/users/all?page=2');
  });

  test('"$tmpl" is the complete path template on insertion functions', () => {
    const paths = jetPaths({
      $path: '/api',
      V1: {
        $path: '/v1',
        Users: {
          $path: '/users',
          One: '/:id',
          Post: '/:userId/posts/:postId',
        },
      },
      Org: {
        $path: '/orgs/:orgId',
        Members: '/members',
        Member: '/members/:memberId',
      },
    });

    expect(paths.V1.Users.One.$tmpl).toBe('/api/v1/users/:id');
    expect(paths.V1.Users.One.$path).toBe('/:id');
    expect(paths.V1.Users.Post.$tmpl).toBe(
      '/api/v1/users/:userId/posts/:postId',
    );
    expect(paths.V1.Users.Post({ userId: 1, postId: 2 })).toBe(
      '/api/v1/users/1/posts/2',
    );
    // Params from a parent's base path
    expect(paths.Org.$tmpl).toBe('/api/orgs/:orgId');
    expect(paths.Org.$path).toBe('/orgs/:orgId');
    expect(paths.Org.Members.$tmpl).toBe('/api/orgs/:orgId/members');
    expect(paths.Org.Members.$path).toBe('/members');
    expect(paths.Org.Member.$tmpl).toBe('/api/orgs/:orgId/members/:memberId');
    expect(paths.Org.Member({ orgId: 'a', memberId: 'b' })).toBe(
      '/api/orgs/a/members/b',
    );
  });

  test('every function has "$path", only insertion functions have "$tmpl"', () => {
    const paths = jetPaths(
      {
        $path: '/api',
        Users: {
          $path: '/users',
          Get: '/all',
          One: '/:id',
        },
        Health: '/health',
      },
      { prepend: 'localhost:3000' },
    );

    expect([paths.$path, paths()]).toEqual(['/api', 'localhost:3000/api']);
    expect([paths.Users.$path, paths.Users()]).toEqual([
      '/users',
      'localhost:3000/api/users',
    ]);
    expect([paths.Users.Get.$path, paths.Users.Get()]).toEqual([
      '/all',
      'localhost:3000/api/users/all',
    ]);
    expect([paths.Users.One.$path, paths.Users.One.$tmpl]).toEqual([
      '/:id',
      'localhost:3000/api/users/:id',
    ]);
    expect([paths.Health.$path, paths.Health()]).toEqual([
      '/health',
      'localhost:3000/api/health',
    ]);
    for (const fn of [paths, paths.Users, paths.Users.Get, paths.Health]) {
      expect('$tmpl' in fn).toBe(false);
    }
  });

  test('"$full" is an ordinary route name', () => {
    const paths = jetPaths({ $path: '/api', $full: '/full' });
    expect(paths.$full()).toBe('/api/full');
    expect(paths.$full.$path).toBe('/full');
  });

  test('throws when a route uses the reserved "$tmpl" key', () => {
    expect(() =>
      // @ts-expect-error - reserved keys are also rejected at compile time
      jetPaths({ $path: '/api', $tmpl: '/a' }),
    ).toThrow(
      'Key "$tmpl" is reserved for the complete path template of routes ' +
        'which need arguments. Key path: "$tmpl".',
    );
    expect(() =>
      jetPaths({
        $path: '/api',
        // @ts-expect-error - reserved keys are rejected in nested groups
        Users: { $path: '/users/:id', $tmpl: { $path: '/a' } },
      }),
    ).toThrowError('Key path: "Users.$tmpl"');
    expect(() =>
      // @ts-expect-error - disabling regex validation does not allow reserved keys
      jetPaths({ $path: '/api', $tmpl: '/a' }, { disableRegex: true }),
    ).toThrowError(/"\$tmpl" is reserved/);
  });

  test('throws when path value count does not match URL params', () => {
    const paths = jetPaths({
      $path: '/api',
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
      $path: '/api',
      Two: '/:id/:slug',
    });

    expect(() => paths.Two({ id: 1, name: 'abc' } as any)).toThrowError(
      /"slug" was not present/,
    );
  });

  test('serializes search params for primitives, arrays, null, and undefined', () => {
    const paths = jetPaths({
      $path: '/api',
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
      $path: '/api',
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
    const paths = jetPaths({ $path: '/api', Search: '/search' });
    class Query {
      public a = 1;
    }
    Object.assign(Query.prototype, { inherited: 2 });

    expect(paths.Search(new Query())).toBe('/api/search?a=1');
  });

  test('encodes search keys and values so they cannot inject params', () => {
    const paths = jetPaths({ $path: '/api', Search: '/search' });

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
      $path: '/api',
      Search: '/search',
    });

    expect(paths.Search({})).toBe('/api/search');
  });

  test('encodes path values', () => {
    const paths = jetPaths({
      $path: '/api',
      Users: {
        $path: '/users',
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
      $path: '/api',
      Users: {
        $path: '/users',
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
      $path: '/api',
      Users: {
        $path: '/users',
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
      { $path: '/api', A: 'a' },
      { $path: '/api', A: '/user profile' },
      { $path: '/api', A: '/a?b=1' },
      { $path: '/api', A: '/a/../b' },
      { $path: '/api', A: '/:id.json' },
      { $path: '/api', A: '' },
      { $path: 'api', A: '/a' },
      { $path: '/', A: '/a' },
      { $path: '/api', Users: { $path: 'users', A: '/a' } },
    ];
    for (const routes of invalid) {
      expect(() => jetPaths(routes as any)).toThrowError(
        /failed to pass validation/i,
      );
    }
    expect(() => jetPaths({ $path: '/api', A: 'a' } as any)).toThrowError(
      'Key path: "A", URL: "a"',
    );
    expect(() =>
      jetPaths({ $path: '/api', Users: { $path: 'users' } } as any),
    ).toThrowError('Key path: "Users.$path"');
  });

  test('allows valid route templates', () => {
    const paths = jetPaths({
      $path: '',
      Kebab: '/user-profile',
      Dots: '/v1.0/fileon',
      Tilde: '/~me',
      Escaped: '/a%20b',
      Slash: '/',
      Users: {
        $path: '/users',
        One: '/:user_id/',
      },
    });

    expect(paths()).toBe('');
    expect(paths.Kebab()).toBe('/user-profile');
    expect(paths.Dots()).toBe('/v1.0/fileon');
    expect(paths.Tilde()).toBe('/~me');
    expect(paths.Escaped()).toBe('/a%20b');
    expect(paths.Slash()).toBe('/');
    expect(paths.Users.One({ user_id: 5 })).toBe('/users/5/');
  });

  test('preserves empty and dotted property names in validation errors', () => {
    expect(() =>
      jetPaths({ $path: '/api', '': { $path: '/empty', Bad: 'bad' } }),
    ).toThrowError('Key path: ".Bad", URL: "bad"');
    expect(() => jetPaths({ $path: '/api', '': {} } as any)).toThrowError(
      'Key path: "".',
    );
    expect(() =>
      jetPaths({ $path: '/api', '': { $path: 'bad' } }),
    ).toThrowError('Key path: ".$path", URL: "bad"');
    expect(() =>
      jetPaths({
        $path: '/api',
        'Users.V1': { $path: '/users', Bad: null },
      } as any),
    ).toThrowError('Key path: "Users.V1.Bad".');
  });

  test('reports the full URL when joined templates are invalid', () => {
    expect(() =>
      jetPaths({ $path: '/api/', Users: { $path: '/users' } }),
    ).toThrowError('Key path: "Users.$path", URL: "/api//users"');
  });

  test('keeps trailing slashes when inserting path values', () => {
    const paths = jetPaths({ $path: '/api', One: '/:id/' });

    expect(paths.One.$tmpl).toBe('/api/:id/');
    expect(paths.One({ id: 5 })).toBe('/api/5/');
  });

  test('inserts the same value for repeated param names', () => {
    const paths = jetPaths({ $path: '/api', Dup: '/:id/x/:id' });

    expect(paths.Dup({ id: 5 })).toBe('/api/5/x/5');
  });

  test('skips template validation when disableRegex=true', () => {
    const paths = jetPaths(
      {
        $path: '/api',
        Users: {
          $path: '/users',
          One: '/:id',
        },
        Odd: '/a b',
      },
      { disableRegex: true },
    );

    expect(paths.Odd()).toBe('/api/a b');
    expect(paths.Users.One.$tmpl).toBe('/api/users/:id');
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
        $path: '/api',
        Users: {
          $path: '/users',
          One: '/:id',
        },
      },
      { prepend: 'http://bad host' },
    );

    expect(paths.Users.One({ id: 1 })).toBe('http://bad host/api/users/1');
  });

  test('throws when the root "$path" is missing', () => {
    expect(() => jetPaths({ Users: { $path: '/users' } } as any)).toThrowError(
      'Key "$path" must exist on every object and its value must be a ' +
        'string. Key path: "(root)".',
    );
  });

  test('throws when a nested "$path" is missing or invalid', () => {
    expect(() =>
      jetPaths({
        $path: '/api',
        Users: {
          Add: '/add',
        },
      } as any),
    ).toThrowError('Key "$path" must exist on every object');
    for (const value of [undefined, 123, null, {}]) {
      expect(() =>
        jetPaths({
          $path: '/api',
          Users: {
            $path: value,
            Add: '/add',
          },
        } as any),
      ).toThrowError('Key path: "Users"');
    }
  });

  test('throws for route values which are not strings or plain objects', () => {
    for (const value of [[], null, 5, true]) {
      expect(() => jetPaths({ $path: '/api', Bad: value } as any)).toThrowError(
        'Route values must be a string or a plain object. Key path: "Bad".',
      );
    }
    expect(() =>
      jetPaths({ $path: '/api', Users: { $path: '/users', Bad: null } } as any),
    ).toThrowError('Key path: "Users.Bad"');
  });

  test('treats first argument as search params for static routes', () => {
    const paths = jetPaths({
      $path: '/api',
      Users: {
        $path: '/users',
        Add: '/add',
      },
    });

    expect(paths.Users.Add({ role: 'admin', page: 2 })).toBe(
      '/api/users/add?role=admin&page=2',
    );
  });

  test('every function has "$path" set to the local path template', () => {
    const paths = jetPaths(
      {
        $path: '/api',
        Users: {
          $path: '/users',
          Get: '/all',
          One: '/:id',
        },
      },
      { prepend: 'localhost:3000' },
    );

    expect(paths.$path).toBe('/api');
    expect(paths.Users.$path).toBe('/users');
    expect(paths.Users.Get.$path).toBe('/all');
    expect(paths.Users.One.$path).toBe('/:id');
    expect(paths.Users.One.$tmpl).toBe('localhost:3000/api/users/:id');
    expect(paths.Users()).toBe('localhost:3000/api/users');
    expect(paths.Users.One({ id: 5 })).toBe('localhost:3000/api/users/5');
  });

  test('group functions accept path params and search params', () => {
    const paths = jetPaths({
      $path: '/api',
      User: {
        $path: '/users/:userId',
        Posts: '/posts',
      },
    });

    expect(paths.User({ userId: 7 }, { page: 2 })).toBe('/api/users/7?page=2');
    expect(paths.User.Posts({ userId: 7 })).toBe('/api/users/7/posts');
  });

  test('allows keys which collide with built-in function properties', () => {
    const paths = jetPaths({
      $path: '/api',
      name: '/name',
      length: {
        $path: '/length',
        Get: '/all',
      },
    });

    expect(paths.name()).toBe('/api/name');
    expect(paths.length()).toBe('/api/length');
    expect(paths.length.Get()).toBe('/api/length/all');
  });
});

describe('declared search keys', () => {
  const Paths = jetPaths({
    $path: '/api',
    Users: {
      $path: '/users',
      Search: '/search?<q!><page><sort>',
      Filter: '/filter?<page><sort>',
      One: '/:id?<expand>',
      Posts: '/:id/posts?<tag!>',
    },
  });

  test('builds urls with declared keys', () => {
    expect(Paths.Users.Search({ q: 'sean', page: 2 })).toBe(
      '/api/users/search?q=sean&page=2',
    );
    expect(Paths.Users.Search({ q: ['a', 'b'], sort: undefined })).toBe(
      '/api/users/search?q=a&q=b',
    );
    expect(Paths.Users.Filter({})).toBe('/api/users/filter');
    expect(Paths.Users.One({ id: 5 })).toBe('/api/users/5');
    expect(Paths.Users.One({ id: 5 }, { expand: true })).toBe(
      '/api/users/5?expand=true',
    );
    expect(Paths.Users.Posts({ id: 1 }, { tag: 'x' })).toBe(
      '/api/users/1/posts?tag=x',
    );
  });

  test('declared keys are not part of "$path" or the template', () => {
    expect(Paths.Users.Search.$path).toBe('/search');
    expect(Paths.Users.Search.$tmpl).toBe('/api/users/search');
    expect(Paths.Users.One.$path).toBe('/:id');
    expect(Paths.Users.One.$tmpl).toBe('/api/users/:id');
  });

  test('throws for keys which are not declared', () => {
    expect(() => Paths.Users.Search({ q: 'x', pgae: 2 } as any)).toThrowError(
      'Search key "pgae" is not declared on the route.',
    );
    expect(() => Paths.Users.Filter({ nope: undefined } as any)).toThrowError(
      /"nope" is not declared/,
    );
    expect(() =>
      Paths.Users.One({ id: 5 }, { expnd: true } as any),
    ).toThrowError(/"expnd" is not declared/);
  });

  test('throws when a required key has no value', () => {
    for (const search of [
      {},
      { q: undefined },
      { q: [] },
      { q: [undefined] },
    ]) {
      expect(() => Paths.Users.Search(search as any)).toThrowError(
        'Search key "q" is required and must have a value.',
      );
    }
    expect(() =>
      // @ts-expect-error - insertion functions need them for a required key
      Paths.Users.Posts({ id: 1 }),
    ).toThrowError(/"tag" is required/);
    expect(() => Paths.Users.Posts({ id: 1 }, null as any)).toThrowError(
      /search params must be an object/i,
    );
    // "null" is a value
    expect(Paths.Users.Search({ q: null })).toBe('/api/users/search?q=null');
  });

  test('validates the declared keys at setup', () => {
    const invalid = [
      '/search?',
      '/search?<>',
      '/search?<q',
      '/search?q>',
      '/search?<q>>',
      '/search?<<q>>',
      '/search?<q>&<page>',
      '/search?<q> <page>',
      '/search?<q>page',
      '/search?q&page',
      '/search?<a b>',
      '/search?<q!!>',
      '/search?<!q>',
      '/search?<q>#top',
      '/search?<q=1>',
      '/search?<q><q>',
      '/search?<q><q!>',
    ];
    for (const route of invalid) {
      expect(() =>
        jetPaths({ $path: '/api', Search: route } as any),
      ).toThrowError(`Key path: "Search", URL: "${route}"`);
    }
    // Search keys can only be declared on routes
    expect(() =>
      jetPaths({ $path: '/api', Users: { $path: '/users?<q>', One: '/:id' } }),
    ).toThrowError(/failed to pass validation/);
  });

  test('routes with a required search key need arguments', () => {
    // @ts-expect-error - the search params are required
    expect(() => Paths.Users.Search()).toThrowError(
      'Search key "q" is required and must have a value.',
    );
    expect(Paths.Users.Search.$tmpl).toBe('/api/users/search');
    // Only optional keys: no arguments still returns the url
    expect(Paths.Users.Filter()).toBe('/api/users/filter');
    expect('$tmpl' in Paths.Users.Filter).toBe(false);
  });

  test('required keys only count own, enumerable values', () => {
    const inherited: unknown = Object.create({ q: 'x' });
    const hidden = Object.defineProperty({}, 'q', {
      value: 'x',
      enumerable: false,
    });
    for (const search of [inherited, hidden]) {
      expect(() => Paths.Users.Search(search as any)).toThrowError(
        'Search key "q" is required and must have a value.',
      );
    }
  });

  test('parses declared keys when disableRegex=true', () => {
    const paths = jetPaths(
      { $path: '/api', Search: '/@me?<q!><page>' },
      { disableRegex: true },
    );
    expect(paths.Search({ q: 'x' })).toBe('/api/@me?q=x');
    expect(() => paths.Search({ page: 1 } as any)).toThrowError(
      /"q" is required/,
    );
    // No "<key>" found, so nothing is declared and any keys are accepted
    const open = jetPaths(
      { $path: '/api', Search: '/search?junk' },
      { disableRegex: true },
    );
    expect(open.Search()).toBe('/api/search');
    expect(open.Search({ anything: 1 })).toBe('/api/search?anything=1');
  });
});
