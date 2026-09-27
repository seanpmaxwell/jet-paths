# ✈️ &nbsp; jet-paths

[![npm version](https://img.shields.io/npm/v/jet-paths.svg)](https://www.npmjs.com/package/jet-paths)
[![npm downloads](https://img.shields.io/npm/dm/jet-paths.svg)](https://www.npmjs.com/package/jet-paths)
[![TypeScript](https://img.shields.io/badge/TypeScript-✔-blue)](https://www.typescriptlang.org/)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jet-paths?label=bundle&color=0f172a)](https://bundlephobia.com/package/jet-paths)
[![License](https://img.shields.io/npm/l/jet-paths.svg)](LICENSE)

Recursively formats an object of URLs so that full paths are set up automatically, allowing you to insert path parameters and append search parameters easily and consistently.

<p align="center">* * *</p>

## 👀 At a glance

#### Installation:

```bash
npm install jet-paths
```

#### Snippet:

<!-- prettier-ignore -->
```ts
const Paths = jetPaths({
  $path: '/api',
  Users: {
    $path: '/users',
    Get: '/all',
    One: '/:id',
  },
});

Paths.Users();                 // '/api/users'
Paths.Users.$path;             // '/users'

Paths.Users.Get();             // '/api/users/all'
Paths.Users.Get.$path;         // '/all'

Paths.Users.One({ id: 5 });    // '/api/users/5'
Paths.Users.One({ name: 5 });  // ❌ Type error: 'name' does not exist in type '{ id: Primitive }'
Paths.Users.One();             // ❌ Type error: expected at least one argument
Paths.Users.One.$path;         // '/:id'
Paths.Users.One.$tmpl;         // '/api/users/:id'

Paths.$path;                   // '/api'
```

> `$path` is the local path template. Routes that need arguments (path parameters or a required search key) also have `$tmpl`: the complete path template, including parent paths and any prefix. Call a route to build a URL; routes that don't need arguments return it when called with no arguments.

<p align="center">* * *</p>

## 🤔 Why jet-paths?

- Nested objects become full-URL functions, no repeated prefixes.
- Single source of truth for all your routes
- Every key, including nested objects, is a function which:
  - Can append search params with an object.
  - Has the `.$path` property. Which the string value of its local path.
  - Returns its full URL when called with no arguments, unless it has path-variables.
- Path-variables (`/:name`) make an **insertion function**, which always requires a path-variable object, type-checked and validated at runtime.
  - Has the `.$tmpl` property: the complete path template, including parent paths and any prefix.
  - The parameter to append search params becomes the second argument. 
- Declare a route's search keys (`'/search?<q!><page>'`) to type-check its search params too; `!` marks a required key.
- Path and search values are URL-encoded against injection.
- Route templates are validated once at setup, so typos fail fast.
- **TypeScript-first** and fully type-safe.

<p align="center">* * *</p>

## ⚡ Tutorial

- [Another, more complete snippet](#another-more-complete-snippet)
- [Insert path parameters](#insert-path-parameters)
- [Append search parameters and encode values](#append-search-parameters-and-encode-values)
- [Declare search parameters](#declare-search-parameters)
- [Inherit path parameters from parents](#inherit-path-parameters-from-parents)
- [Group routes without adding a path segment](#group-routes-without-adding-a-path-segment)
- [Destructure routes and paths](#destructure-routes-and-paths)
- [Using with React](#using-with-react)
- [Options](#options)
- [Full behavior in detail](#full-behavior-in-detail)

#### Another, more complete snippet

```ts
import jetPaths from 'jet-paths';

const Paths = jetPaths(
  {
    $path: '/api',
    Users: {
      $path: '/users',
      Get: '/all',
      Add: '/add',
      Update: '/update',
      Delete: '/delete/:id',
    },
    Posts: {
      $path: '/posts',
      Get: '/all?<q!><page>',
      Add: '/add',
      Update: '/update',
      Delete: '/delete/:id',
      Private: {
        $path: '/private',
        Get: '/all',
        Delete: '/delete/:foo/bar/:id',
      },
    },
  },
  { prepend: 'localhost:3000' },
);
```

The object above is formatted into type-safe routes:

```ts
Paths.Users();                                    // "localhost:3000/api/users"
Paths.Users.$path;                                // "/users"
Paths.Users.Get({ page: 2 });                     // "localhost:3000/api/users/all?page=2"
Paths.Users.Delete({ id: 1 });                    // "localhost:3000/api/users/delete/1"
Paths.Users.Delete.$tmpl;                         // "localhost:3000/api/users/delete/:id"
Paths.Posts.Get({ q: 'x', page: 2 });             // "localhost:3000/api/posts/all?q=x&page=2"
Paths.Posts.Get({ q: 'x', pg: 3 });               // ❌ type error
Paths.Posts.Private.Delete({ foo: 'a', id: 2 });  // "localhost:3000/api/posts/private/delete/a/bar/2"
```

If you store the definition in a variable before passing it to `jetPaths`, use `as const` to preserve the literal templates. TypeScript rejects widened `string` templates because their parameter names cannot be inferred safely:

```ts
const definition = {
  $path: '/api',
  One: '/users/:id',
} as const;

const UserPaths = jetPaths(definition);
UserPaths.One({ id: 5 }); // "/api/users/5"
```

---

#### Insert path parameters

Insertion functions always require path parameters as the first argument. Pass an optional second object to append search parameters:

```ts
// Insert path parameters without appending search parameters.
Paths.Users.Delete({ id: 1 });
// "localhost:3000/api/users/delete/1"

// Insert the same path parameters and append search parameters.
Paths.Users.Delete({ id: 1 }, { permanent: true });
// "localhost:3000/api/users/delete/1?permanent=true"

// The same applies to nested routes with multiple path parameters.
Paths.Posts.Private.Delete({ foo: 'a', id: 2 });
// "localhost:3000/api/posts/private/delete/a/bar/2"

Paths.Posts.Private.Delete({ foo: 'a', id: 2 }, { tags: ['draft', 'old'] });
// "localhost:3000/api/posts/private/delete/a/bar/2?tags=draft&tags=old"
```

An insertion function's `.$tmpl` keeps the placeholders intact. Missing or unknown path parameters are TypeScript errors, and throw at runtime:

```ts
Paths.Users.Delete.$tmpl; // "localhost:3000/api/users/delete/:id"

// @ts-expect-error - the path parameters object is required
Paths.Users.Delete();

// @ts-expect-error - "id" is missing
Paths.Users.Delete({}, { permanent: true });

// @ts-expect-error - the parameter is named "id", not "userId"
Paths.Users.Delete({ userId: 1 });
```

---

#### Append search parameters and encode values

For routes without path parameters, pass search parameters as the first argument, or no arguments when you don't need a query string. Arrays become repeated keys, `undefined` values are omitted, and `false` and `0` are preserved:

```ts
Paths.Users.Get();
// "localhost:3000/api/users/all"

Paths.Users.Get({
  tags: ['admin', 'editor'],
  page: 0,
  active: false,
  q: undefined,
});
// "localhost:3000/api/users/all?tags=admin&tags=editor&page=0&active=false"

// Group routes can append search parameters too.
Paths.Users({ page: 2 });
// "localhost:3000/api/users?page=2"
```

Pass unencoded values: path and search parameters are encoded automatically. Search parameter values must be primitives or arrays of primitives; convert dates to strings first.

```ts
Paths.Users.Delete({ id: 'team/a' }, { reason: 'duplicate entry' });
// "localhost:3000/api/users/delete/team%2Fa?reason=duplicate%20entry"

Paths.Users.Get({ since: new Date('2026-01-01T00:00:00Z').toISOString() });
// "localhost:3000/api/users/all?since=2026-01-01T00%3A00%3A00.000Z"
```

---

#### Declare search parameters

To type-check a route's search parameters, list their keys after a `?` in the route, each in angle brackets. Keys are optional unless they end with `!` (i.e. `<q!>`). Only declared keys are accepted, and required keys must have a value:

```ts
const UserPaths = jetPaths({
  $path: '/api',
  Users: {
    $path: '/users',
    Search: '/search?<q!><page><sort>',
    One: '/:id?<expand>',
  },
});

UserPaths.Users.Search({ q: 'sean', page: 2 });
// "/api/users/search?q=sean&page=2"

UserPaths.Users.One({ id: 5 }, { expand: true });
// "/api/users/5?expand=true"

// A required key means the search params are required too, so the path
// template is on "$tmpl". The declared keys aren't part of it.
UserPaths.Users.Search.$tmpl; // "/api/users/search"

// @ts-expect-error - the search params are required
UserPaths.Users.Search();

// @ts-expect-error - "q" is required
UserPaths.Users.Search({ page: 2 });

// @ts-expect-error - "pgae" isn't declared
UserPaths.Users.Search({ q: 'sean', pgae: 2 });
```

Routes without declared keys accept any search parameters. Undeclared and missing keys also throw at runtime, for JavaScript callers and values hidden behind broader types.

To split a long declaration across lines, use a template literal with a `\` at the end of each line; it joins the lines without adding a newline. Don't join strings with `+`: TypeScript types the result as `string`, which `jetPaths` rejects.

```ts
const FlightPaths = jetPaths({
  $path: '/api',
  Search: `/flights?<from!><to!><depart!><adults!>\
<return><children><infants><cabin><stops><airline><currency><sort>`,
});

FlightPaths.Search({ from: 'LHR', to: 'JFK', depart: '2026-10-01', adults: 2 });
// "/api/flights?from=LHR&to=JFK&depart=2026-10-01&adults=2"
```

---

#### Inherit path parameters from parents

A parameter in a parent's `$path` is required by that group and all its children, even when a child's local path has no placeholders:

```ts
const OrgPaths = jetPaths({
  $path: '/api',
  Org: {
    $path: '/orgs/:orgId',
    Members: '/members',
    Member: '/members/:memberId',
  },
});

OrgPaths.Org({ orgId: 7 });
// "/api/orgs/7"

OrgPaths.Org.Members({ orgId: 7 }, { page: 2 });
// "/api/orgs/7/members?page=2"

OrgPaths.Org.Member({ orgId: 7, memberId: 42 });
// "/api/orgs/7/members/42"

OrgPaths.Org.Members.$path; // "/members"
OrgPaths.Org.Members.$tmpl; // "/api/orgs/:orgId/members"
```

---

#### Group routes without adding a path segment

Use `$path: ''` when a group should organize your code without changing the URL:

```ts
const PublicPaths = jetPaths({
  $path: '/api',
  Public: {
    $path: '',
    Health: '/health',
    Status: '/status',
  },
});

PublicPaths.Public.Health(); // "/api/health"
PublicPaths.Public.Status(); // "/api/status"
```

---

#### Destructure routes and paths

Destructuring is safe: route functions don't rely on `this`, so they work the same after being pulled off their parent, and a destructured `$path` or `$tmpl` keeps its exact type:

```ts
const { Get, Delete } = Paths.Users;
Get(); // "localhost:3000/api/users/all"
Get({ page: 2 }); // "localhost:3000/api/users/all?page=2"
Delete({ id: 1 }); // "localhost:3000/api/users/delete/1"

const { $path } = Paths.Users.Get; // "/all"
```

Object rest and spread (`{ ...Paths.Users }`) only copy a function's properties, so the result is a plain object, not a callable route.

---

#### Using with React

Create your paths once, at module level, and call routes directly while rendering. Building a URL takes a fraction of a microsecond, and a rebuilt URL is an equal string, so it doesn't re-run effects or change query keys unless its values change:

```tsx
// paths.ts: create the routes once, at module level
export const Paths = jetPaths({
  $path: '/api',
  Users: { $path: '/users', One: '/:id' },
});

// UserComponent.tsx
function UserComponent({ id }: { id: number }) {
  // Rebuilt on every render, but the effect only re-runs when "id" changes
  const url = Paths.Users.One({ id });
  useEffect(() => {
    void fetch(url);
  }, [url]);
  return <a href={url}>User {id}</a>;
}
```

Don't call `jetPaths()` inside a component: it would rebuild every route on each render and create new route functions, which breaks memoized props and effect dependencies.

If profiling shows URL building matters, i.e. in a very large list, memoize it with `useMemo` and primitive dependencies:

```tsx
const url = useMemo(() => Paths.Users.One({ id }), [id]);
```

---

#### Options

- **`prepend`** (`string` | `undefined`, default `undefined`) — Prepends a string verbatim to every generated URL and complete path template. This prefix is not validated or interpolated: put `/:name` parameters in the route definitions, not in `prepend`. Dynamic or optional prefixes widen the types of `.$tmpl` and no-argument calls without losing route-parameter inference.
- **`disableRegex`** (`boolean` | `undefined`, default `false`) — Skips validating the route templates when `jetPaths()` is called. Path and search values are still encoded.

Using both options: `prepend` adds the origin to every URL, and `disableRegex` allows the `@` in `/@me`, which template validation would otherwise reject.

```ts
const Paths = jetPaths(
  {
    $path: '/api',
    Users: {
      $path: '/users',
      Me: '/@me', // "@" fails validation unless "disableRegex" is true
      One: '/:id',
    },
  },
  {
    prepend: 'https://example.com',
    disableRegex: true,
  },
);

Paths.Users.Me(); // "https://example.com/api/users/@me"
Paths.Users.Me({ fields: 'name' }); // "https://example.com/api/users/@me?fields=name"
Paths.Users.One({ id: 5 }); // "https://example.com/api/users/5"
Paths.Users.One.$tmpl; // "https://example.com/api/users/:id"
```

---

#### Full behavior in detail

<details>
<summary>Expand</summary>

- Every object, including the root, must have a `$path` key: the local path template for that object, which is prepended to its children.
  - Set `$path: ''` to group routes without adding a segment.
  - Route groups must be plain objects with their own `$path` property. Null-prototype dictionaries are supported; class instances, dates, and custom prototypes are rejected.
  - Circular definitions throw an error naming the cycle's key path. Reusing a group under multiple parents is allowed.

- Calling functions:
  - **Insertion functions** (functions for URLs with path-variables) always require the path-variable object as their first argument; search params are an optional second argument, unless the route declares a required search key.
  - Routes which declare a required search key always require the search params object.
  - All other functions return their full URL when called with no arguments (i.e. `Paths.Users.Get()` is `'/api/users/all'`), and otherwise require a search params object.
  - Passing `undefined` counts as an argument, so a missing variable (i.e. `Paths.Users.Get(undefined)`) throws instead of returning the URL.

- Keys in the function-argument object for path-variables must match path-variable names.
  - i.e, if the path is `/api/users/:id` object must be `{ id: 5 }`.
  - A path-variable name used more than once (i.e. `/:id/x/:id`) is only passed once and inserted everywhere.
  - Path-variables from a parent's `$path` are included (i.e. with `{ $path: '/users/:userId', Posts: '/posts' }`, `Posts` requires `{ userId }`).
  - Extra keys are rejected on object literals, variables, and spreads when visible to TypeScript. Runtime validation also catches extra keys hidden by a broader type or supplied by JavaScript callers.

- Nested objects are functions too (i.e. `Paths.Users()` is `'/api/users'`), and their child routes are properties on them.

- Every function has a `.$path` property: the local path template (i.e. `Paths.Users.One.$path` is `'/:id'`).

- Functions which need arguments (insertion functions and routes with a required search key) also have a `.$tmpl` property: the complete path template, including parent paths and any prefix from `prepend` (i.e. `Paths.Users.One.$tmpl` is `'/api/users/:id'`). A group whose `$path` has a path-variable is an insertion function too, and so are its children.

- Destructuring is safe. Route functions don't use `this`, so `const { One } = Paths.Users` works with the same type checks, and a destructured `$path` or `$tmpl` keeps its exact literal type. Object rest and spread copy only the properties, so the result isn't callable.

- `$path`, `$tmpl`, and `then` can't be used as route names in the paths object. `then` is reserved so route groups can safely pass through promises. These restrictions also apply when `disableRegex` is enabled.

- Route templates are validated once, when `jetPaths()` is called (see `disableRegex`):
  - Every path must start with a forward-slash `/`. Only `$path` may be an empty string.
  - Static segments may contain letters, numbers, `-`, `.`, `_`, `~` and percent-escapes (i.e. `%20`), but can't be `.` or `..`, including encoded forms such as `%2e`, `%2e%2e`, and `.%2e`.
  - Path-variable names may contain letters, numbers and `_`, and must be a whole segment (`/:id`, not `/:idon`).
  - Fragments (`#`) and empty segments (`//`) are not allowed in templates. `?` is only allowed on routes, to declare search keys (not on `$path`).
  - Invalid route values (anything other than a string or a plain object) and invalid templates throw an error naming the key path (i.e. `Users.One`).

- Values for path-parameters must be a primitive type: i.e. `string | number | boolean | undefined | null`.
  - Values are encoded with `encodeURIComponent`.
  - Values which would change the structure of the URL (`''`, `'.'`, `'..'`) throw an error.

- Values for search-parameters must be a primitive type or an array of primitives.
  - Keys and values are encoded with `encodeURIComponent`.
  - Arrays become repeated keys: `{ ids: [1, 2] }` → `?ids=1&ids=2`.
  - `undefined` values are skipped; `null` becomes `"null"`.
  - Objects (including `Date`) throw an error. Convert them to a string first (i.e. `date.toISOString()`).

- Search keys can be declared after a `?` on a route, each in angle brackets (i.e. `'/search?<q!><page>'`).
  - Keys are optional unless they end with `!` (i.e. `<q!>`). Required keys must have a value: `undefined`, `[]`, and arrays of only `undefined` don't count. A route with a required key can't be called without the search params, so its path template is on `.$tmpl`.
  - Only declared keys are accepted. Extra keys are rejected on object literals, variables, and spreads when visible to TypeScript, and throw at runtime.
  - Declared keys aren't part of `.$path`, `.$tmpl`, or a no-argument URL (i.e. `'/search?<q!><page>'` has a `.$path` of `'/search'`).
  - Routes without declared keys accept any search keys.
  - Keys may contain letters, numbers, `-`, `.`, `_` and `~`, and can't be declared twice. Nothing else may appear between or around the `<key>`s.
  - With `disableRegex`, each `<key>` is still read but not validated. If none are found, the route accepts any search keys.

- Return types:
  - Calling a function with arguments is typed as `string`.
  - `.$tmpl`, and calling a function that doesn't need arguments with no arguments, are typed as the complete path template: an exact literal when the prefix is known; optional prefixes produce a union, and dynamic prefixes produce a wider template-string type.
  - `.$path` is typed as its exact string literal.

</details>

<p align="center">* * *</p>

## 📄 License

MIT © [seanpmaxwell](LICENSE)

Happy web deving! 🚀
