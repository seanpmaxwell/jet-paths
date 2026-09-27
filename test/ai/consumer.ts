// Compiled against source during typecheck and package exports after build.
// This fixture is never executed: invalid calls are intentional type checks.
import jetPaths from 'jet-paths';

// ========================================================================= //
//                                 FUNCTIONS                                 //
// ========================================================================= //

function expectType<T>(_value: T): void {}

export function checkConsumerTypes(): void {
  const definition = {
    $path: '/api',
    One: '/:id',
    Search: '/search',
    Org: { $path: '/orgs/:orgId', Member: '/members/:memberId' },
  } as const;
  const paths = jetPaths(definition);
  expectType<'/api/:id'>(paths.One.$tmpl);
  expectType<'/:id'>(paths.One.$path);
  expectType<string>(paths.One({ id: 1 }));
  expectType<string>(paths.One({ id: 1 }, { tags: ['a', 'b'] }));
  expectType<string>(paths.Org.Member({ orgId: 1, memberId: 2 }));

  const widened = { $path: '/api', One: '/:id' };
  // @ts-expect-error - a widened template cannot safely infer parameters
  jetPaths(widened);
  const nested = { $path: '/users', One: '/:id' };
  // @ts-expect-error - widened nested groups must also use as const
  jetPaths({ $path: '/api', Users: nested });
  const dynamic: string = '/:id';
  // @ts-expect-error - interpolation of an unknown string is not a fixed template
  jetPaths({ $path: '/api', One: `/prefix${dynamic}` as const });

  // @ts-expect-error - arguments must start with the path params
  paths.One(undefined);
  // @ts-expect-error - parent parameters remain required
  paths.Org.Member({ memberId: 2 });
  // @ts-expect-error - arguments to static functions must be search params
  paths.Search(undefined);
  // @ts-expect-error - unknown parameter name
  paths.One({ wrong: 1 });
  const extra = { id: 1, extra: true };
  // @ts-expect-error - extra keys on variables are rejected
  paths.One(extra);
  // @ts-expect-error - extra keys through spreads are rejected
  paths.One({ ...extra });
  // @ts-expect-error - parent/child params also reject extra keys
  paths.Org.Member({ orgId: 1, memberId: 2, extra: true });

  interface IdParams {
    id: number;
  }
  const idParams: IdParams = { id: 1 };
  expectType<string>(paths.One(idParams));
  interface Query {
    page?: number;
    tags: readonly string[];
  }
  const query: Query = { tags: ['a'] };
  expectType<string>(paths.Search(query));
  expectType<string>(paths.One(idParams, query));
  // @ts-expect-error - search values cannot be nested objects
  paths.One(idParams, { meta: { nested: true } });

  const prefixed = jetPaths(definition, { prepend: '/:tenant' });
  expectType<'/:tenant/api/:id'>(prefixed.One.$tmpl);
  expectType<string>(prefixed.One({ id: 1 }));
  expectType<string>(prefixed.Search({ q: 1 }));
  // @ts-expect-error - prefix placeholders are not interpolated
  prefixed.One({ id: 1, tenant: 'acme' });

  const typedOptions: { prepend?: string } = {
    prepend: 'https://example.test',
  };
  const uncertain = jetPaths(definition, typedOptions);
  expectType<`${string}/api/:id`>(uncertain.One.$tmpl);
  // @ts-expect-error - optional prefixes must not promise an unprefixed literal
  expectType<'/api/:id'>(uncertain.One.$tmpl);

  const maybeOptions =
    Math.random() > 0.5
      ? { prepend: 'https://example.test' as const }
      : undefined;
  const maybe = jetPaths(definition, maybeOptions);
  const maybeTemplate = maybe.One.$tmpl;
  expectType<'/api/:id' | 'https://example.test/api/:id'>(maybeTemplate);
  expectType<typeof maybeTemplate>('/api/:id');
  expectType<typeof maybeTemplate>('https://example.test/api/:id');
  expectType<string>(maybe.One({ id: 1 }));
  const dynamicPrefix: string = 'https://example.test';
  const dynamicPaths = jetPaths(definition, { prepend: dynamicPrefix });
  expectType<string>(dynamicPaths.One({ id: 1 }));
  // @ts-expect-error - dynamic prefixes must not erase parameter validation
  dynamicPaths.One({ wrong: 1 });
  expectType<'/api/:id'>(jetPaths(definition, undefined).One.$tmpl);
  expectType<'/api/:id'>(
    jetPaths(definition, { disableRegex: true }).One.$tmpl,
  );

  const optionalPrefix: { prepend?: 'https://example.test' } = {};
  const optional = jetPaths(definition, optionalPrefix);
  const optionalTemplate = optional.One.$tmpl;
  expectType<'/api/:id' | 'https://example.test/api/:id'>(optionalTemplate);
  expectType<typeof optionalTemplate>('/api/:id');
  expectType<typeof optionalTemplate>('https://example.test/api/:id');

  const searchPaths = jetPaths({
    $path: '/api',
    Search: '/search?<q!><page>',
    One: '/:id?<expand>',
  });
  expectType<'/api/search'>(searchPaths.Search.$tmpl);
  expectType<'/api/:id'>(searchPaths.One.$tmpl);
  expectType<string>(searchPaths.Search({ q: 'x', page: 2 }));
  expectType<string>(searchPaths.One({ id: 1 }, { expand: true }));
  // @ts-expect-error - undeclared search key
  searchPaths.Search({ q: 'x', pgae: 2 });
  // @ts-expect-error - missing required search key
  searchPaths.Search({ page: 2 });

  // "$full" is an ordinary route name
  expectType<'/api/full'>(jetPaths({ $path: '/api', $full: '/full' }).$full());
  // @ts-expect-error - reserved promise property
  jetPaths({ $path: '/api', then: '/then' });
  // @ts-expect-error - reserved properties are checked recursively
  jetPaths({ $path: '/api', Group: { $path: '', then: '/then' } });
}
