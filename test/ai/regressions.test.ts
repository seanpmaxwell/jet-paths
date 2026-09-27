import { describe, expect, test } from 'vitest';

import jetPaths from '../../src/index';

// ========================================================================= //
//                                   TESTS                                   //
// ========================================================================= //

describe('template validation', () => {
  test.each(['%2e', '%2E', '%2e%2e', '%2E%2e', '.%2e', '%2E.'])(
    'rejects URL-normalized dot segment %s',
    (segment) => {
      const route = `/users/${segment}/admin`;
      expect(new URL(`/api${route}`, 'https://example.test').pathname).not.toBe(
        `/api${route}`,
      );
      expect(() => jetPaths({ $path: '/api', One: route } as any)).toThrow(
        /failed to pass validation/,
      );
      expect(() => jetPaths({ $path: `/api/${segment}` } as any)).toThrow(
        /failed to pass validation/,
      );
    },
  );

  test('preserves safe escapes and encoded parameter values', () => {
    const paths = jetPaths({
      $path: '/api',
      Safe: '/a%20b/%2Ename/%252e%252e/...',
      One: '/:id',
    });
    const url = new URL(paths.Safe(), 'https://example.test');
    expect(url.pathname).toBe(paths.Safe());
    expect(paths.One({ id: '%2e%2e' })).toBe('/api/%252e%252e');
  });

  test('leaves prefix placeholders literal', () => {
    const paths = jetPaths(
      { $path: '/api', One: '/:id', Search: '/search' },
      { prepend: '/:tenant' },
    );
    expect(paths.One({ id: 1 })).toBe('/:tenant/api/1');
    expect(paths.Search({ q: 1 })).toBe('/:tenant/api/search?q=1');
  });
});

describe('route tree validation', () => {
  test('rejects then at any depth even when regex checks are disabled', () => {
    for (const disableRegex of [false, true]) {
      expect(() =>
        // @ts-expect-error - promise-related property is reserved
        jetPaths({ $path: '/api', then: '/then' }, { disableRegex }),
      ).toThrow(/Key "then" is reserved.*Key path: "then"/);
      expect(() =>
        jetPaths(
          {
            $path: '/api',
            // @ts-expect-error - nested promise-related property is reserved
            Group: { $path: '', then: '/then' },
          },
          { disableRegex },
        ),
      ).toThrow(/Key path: "Group.then"/);
    }
  });

  test('ordinary route trees can pass through promises', async () => {
    const paths = jetPaths({ $path: '/api', One: '/:id' });
    await expect(Promise.resolve(paths)).resolves.toBe(paths);
  });

  test('rejects class instances and dates instead of losing inherited routes', () => {
    class Routes {
      $path = '/api';
      get One() {
        return '/one';
      }
    }
    for (const routes of [
      new Routes(),
      Object.assign(new Date(), { $path: '/api' }),
    ]) {
      expect(() => jetPaths(routes as any)).toThrow(/plain object.*\(root\)/);
      expect(() => jetPaths({ $path: '', Group: routes } as any)).toThrow(
        /plain object.*Group/,
      );
    }
  });

  test('allows null-prototype dictionaries', () => {
    const routes: unknown = Object.assign(Object.create(null), {
      $path: '/api',
      One: '/:id',
    });
    const paths = jetPaths(routes as { $path: '/api'; One: '/:id' });
    expect(paths.One({ id: 5 })).toBe('/api/5');
  });

  test('reports direct and indirect cycles with the key path', () => {
    const direct: Record<string, unknown> = { $path: '/api' };
    direct.Self = direct;
    expect(() => jetPaths(direct as any)).toThrow(
      'Circular route definition. Key path: "Self".',
    );
    const parent: Record<string, unknown> = { $path: '/api' };
    const child = { $path: '/child', Parent: parent };
    parent.Child = child;
    expect(() => jetPaths(parent as any)).toThrow(
      'Circular route definition. Key path: "Child.Parent".',
    );
  });

  test('allows shared acyclic subtrees with different parent paths', () => {
    const shared = { $path: '/shared', One: '/:id' } as const;
    const paths = jetPaths({
      $path: '/api',
      Left: { $path: '/left', Shared: shared },
      Right: { $path: '/right', Shared: shared },
    });
    expect(paths.Left.Shared.One({ id: 1 })).toBe('/api/left/shared/1');
    expect(paths.Right.Shared.One({ id: 2 })).toBe('/api/right/shared/2');
  });
});

test('preserves query encoding and omitted values', () => {
  const paths = jetPaths({ $path: '/api', Search: '/search' });
  expect(paths.Search({ 'tag &': ['a', undefined, 'b'], empty: [] })).toBe(
    '/api/search?tag%20%26=a&tag%20%26=b',
  );
  // Omitted values must not start encoding keys that previously went unused.
  expect(paths.Search({ '\ud800': undefined })).toBe('/api/search');
});

describe('errors', () => {
  // Engines without "captureStackTrace" keep the helper's frame by design
  test.runIf(typeof Error.captureStackTrace === 'function')(
    'stack traces start where the error was thrown',
    () => {
      let stack = '';
      try {
        jetPaths({ Users: { $path: '/users' } } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        stack = (error as Error).stack ?? '';
      }
      // The first source file in the stack is where jet-paths threw
      const firstFrame = stack
        .split('\n')
        .find((line) => /\.[jt]s\b/.test(line));
      expect(firstFrame).toContain('jetPaths');
      expect(stack).not.toContain('Errors.ts');
    },
  );
});
