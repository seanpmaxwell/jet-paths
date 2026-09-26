import jetPaths from 'jet-paths';
import assert from 'node:assert/strict';

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //
// Smoke test for the built package. Run after "npm run build". Imports
// through the package "exports" (self-reference) the same way consumers do.

const Paths = jetPaths(
  { _: '/api', Users: { _: '/users', One: '/:id' } },
  { prepend: 'http://localhost:3000' },
);

assert.equal(typeof jetPaths, 'function');
assert.equal(Paths.Users(), 'http://localhost:3000/api/users');
assert.equal(Paths.Users._, '/users');
assert.equal(
  Paths.Users.One({ id: 'a b' }, { q: 1 }),
  'http://localhost:3000/api/users/a%20b?q=1',
);

console.log('lib smoke test passed');
