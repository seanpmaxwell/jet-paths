import jetPaths from 'jet-paths';
import assert from 'node:assert/strict';

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //
// Smoke test for the built package. Run after "npm run build". Imports
// through the package "exports" (self-reference) the same way consumers do.

const Paths = jetPaths(
  { $path: '/api', Users: { $path: '/users', One: '/:id' } },
  { prepend: 'http://localhost:3000' },
);

assert.equal(typeof jetPaths, 'function');
assert.equal(Paths.Users(), 'http://localhost:3000/api/users');
assert.equal(Paths.Users.$path, '/users');
assert.equal(Paths.Users.One.$tmpl, 'http://localhost:3000/api/users/:id');
assert.equal('$tmpl' in Paths.Users, false);
assert.throws(() => Paths.Users.One(), /use "\$tmpl"/i);
assert.throws(() => Paths.Users(undefined), /search params must be an object/i);
assert.equal(Paths.Users({ q: 1 }), 'http://localhost:3000/api/users?q=1');
assert.throws(
  () => Paths.Users.One(undefined),
  /path params must be an object/i,
);
assert.equal(
  Paths.Users.One({ id: 'a b' }, { q: 1 }),
  'http://localhost:3000/api/users/a%20b?q=1',
);

// "$path" is required on every object
assert.throws(
  () => jetPaths({ $path: '/api', Admin: { Stats: '/stats' } }),
  /"\$path" must exist on every object/,
);

// Declared search keys
const Search = jetPaths({ $path: '/api', Find: '/find?<q!><page>' });
assert.equal(Search.Find({ q: 'a b', page: 2 }), '/api/find?q=a%20b&page=2');
assert.equal(Search.Find.$tmpl, '/api/find');
assert.throws(() => Search.Find(), /"q" is required/);
assert.throws(() => Search.Find({ page: 2 }), /"q" is required/);
assert.throws(() => Search.Find({ q: 'a', pgae: 2 }), /"pgae" is not declared/);

console.log('lib smoke test passed');
