# jet-paths ✈️

[![npm version](https://img.shields.io/npm/v/jet-paths.svg)](https://www.npmjs.com/package/jet-paths)
[![npm downloads](https://img.shields.io/npm/dm/jet-paths.svg)](https://www.npmjs.com/package/jet-paths)
[![TypeScript](https://img.shields.io/badge/TypeScript-✔-blue)](https://www.typescriptlang.org/)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jet-paths?label=bundle&color=0f172a)](https://bundlephobia.com/package/jet-paths)
[![License](https://img.shields.io/npm/l/jet-paths.svg)](LICENSE)

Recursively formats an object of URLs so that full paths are set up automatically, allowing you to insert path parameters and append search parameters easily and consistently.

<p align="center">· · ·</p>

## 👀 At a glance

```ts
const Paths = jetPaths({
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id',
  },
});

Paths.Users.Get(); // '/api/users/all'
Paths.Users(); // '/api/users'
Paths.Users._; // '/users'
Paths.Users.One({ id: 5 }); // '/api/users/5'
Paths.Users.One._; // '/:id'
```

<p align="center">· · ·</p>

## 🤔 Why jet-paths?

- Automatically sets up functions to return full URLs using nested objects, avoiding repeated prefixes.
- Every key (including nested objects) is converted to a function which returns the full URL and enables appending search-parameters with an object.
- Every function has a `._` property which is the original unformatted partial path.
- URLs with path-variables (i.e `/:name`) have an additional function-argument to insert values.
- Function-argument to insert path-variables is an object type-literal, whose keys match path-variable names.
  - Path-variable object is validated both at runtime and compile time.
- Path and search values are URL-encoded, so user input can't change the structure of a URL.
- Route templates are validated once, when the object is set up, so typos fail fast.
- **TypeScript-first** and fully type-safe.

---

### Keep your routes organized

With **jet-paths**, you can keep all routes for your entire application neatly formatted into a single object—without repetitive prefixes or custom wrapper functions to insert URL parameters.

Traditionally, routes are often defined like the snippet below. As applications grow, this approach becomes repetitive and error-prone:

```ts
const BASE = '/api';
const BASE_USERS = `${BASE}/users`;

{
  Users: {
    Get: `${BASE_USERS}/all`,
    One: (id: string | number) => `${BASE_USERS}/${id}`,
  },
  // ...more routes
}
```

---

### Insert path parameters and append search parameters

Mark URL parameters using `/:`. Any URL containing a parameter is automatically formatted as a function—both at runtime and compile time.

```ts
const Paths = jetPaths({
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id',
    FooBar: '/foo/:name/bar/:id',
    Search: '/search',
    Other: '/other/:name/blah',
  },
});

Paths.Users.FooBar({ id: 5, name: 'sean' }); // "/api/users/foo/sean/bar/5" - order doesn't matter
Paths.Users.Search({ query: 's@e.com' }); // "/api/users/search?query=s%40e.com"
Paths.Users.Other({ name: 'joe' }, { ids: [1, 2, 3] }); // "/api/users/other/joe/blah?ids=1&ids=2&ids=3"
```

<p align="center">· · ·</p>

## ⚡ Quick Start

### Installation

```bash
npm install jet-paths
```

> **jet-paths** is ESM-only and requires Node.js 18 or later (or any modern bundler).

### Example

```ts
import jetPaths from 'jet-paths';

const Paths = jetPaths(
  {
    _: '/api',
    Users: {
      _: '/users',
      Get: '/all',
      Add: '/add',
      Update: '/update',
      Delete: '/delete/:id',
    },
    Posts: {
      _: '/posts',
      Get: '/all',
      Add: '/add',
      Update: '/update',
      Delete: '/delete/:id',
      Private: {
        _: '/private',
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
Paths.Users(); // "localhost:3000/api/users"
Paths.Users._; // "/users"
Paths.Users.Delete({ id: 1 }); // "localhost:3000/api/users/delete/1"
Paths.Posts.Private.Delete({ foo: 'a', id: 2 }); // "localhost:3000/api/posts/private/delete/a/bar/2"
```

<p align="center">· · ·</p>

## 📥 Key behaviors to note

- You may pass an object/s or no arguments at all when calling a URL function.
- Keys in the function-argument object for path-variables must match path-variable names.
  - i.e, if the path is `/api/users/:id` object must be `{ id: 5 }`.
  - A path-variable name used more than once (i.e. `/:id/x/:id`) is only passed once and inserted everywhere.
- Nested objects are functions too: calling one returns its full base URL (i.e. `Paths.Users()`), and its child routes are properties on it.
- The `._` property is always the partial path from the original object, not the full URL (i.e. `Paths.Users.One._` is `'/:id'`).
- Route templates are validated once, when `jetPaths()` is called (see `disableRegex`):
  - Every path must start with a forward-slash `/`. Only the `_` key may be an empty string.
  - Static segments may contain letters, numbers, `-`, `.`, `_`, `~` and percent-escapes (i.e. `%20`), but can't be `.` or `..`.
  - Path-variable names may contain letters, numbers and `_`, and must be a whole segment (`/:id`, not `/:id.json`).
  - Query strings (`?`), fragments (`#`) and empty segments (`//`) are not allowed in templates.
  - Invalid route values (anything other than a string or a plain object) and invalid templates throw an error naming the key path (i.e. `Users.One`).
- Values for path-parameters must be a primitive type: i.e. `string | number | boolean | undefined | null`.
  - Values are encoded with `encodeURIComponent`.
  - Values which would change the structure of the URL (`''`, `'.'`, `'..'`) throw an error.
- Values for search-parameters must be a primitive type or an array of primitives.
  - Keys and values are encoded with `encodeURIComponent`.
  - Arrays become repeated keys: `{ ids: [1, 2] }` → `?ids=1&ids=2`.
  - `undefined` values are skipped; `null` becomes `"null"`.
  - Objects (including `Date`) throw an error. Convert them to a string first (i.e. `date.toISOString()`).
- Function parameters are optional in case you want to return the original string (i.e. testing).
  - Calling the function with no arguments returns the unformatted URL, and is typed as that exact string literal.
  - Calling it with arguments is typed as `string`.

<p align="center">· · ·</p>

## ⚙️ Options

#### `prepend:` (`string` | `undefined`, default: `undefined`)

Prepends a string to the beginning of every route. While this can also be achieved via the root `_` key, passing a non-constant value here will cause type information to be lost.

> Note: routes in the object are validated; however, the `prepend` value is not.

#### `disableRegex:` (`boolean` | `undefined`, default: `false`)

Skips validating the route templates when `jetPaths()` is called. Path and search values are still encoded.

<p align="center">· · ·</p>

## 🚚 Migrating from v3

- **ESM-only:** `require('jet-paths')` is no longer supported. Use `import` (Node.js 18+).
- **Every key is a function:** nested objects are now callable, i.e. `Paths.Users()` returns `"/api/users"`.
- **`._` is the partial path:** `Paths.Users._` is now `"/users"` (it used to be the full URL). Call `Paths.Users()` for the full URL.
  - Because the routes object is now a function, `JSON.stringify(Paths)` returns `undefined` and `Object.keys(Paths)` includes `"_"`.
- **Values are encoded:** i.e. `'a b'` becomes `'a%20b'` instead of throwing a validation error.
- **Arrays in search params** are now repeated keys (`ids=1&ids=2`) instead of JSON (`ids=[1,2]`).
- **`undefined` search values** are skipped instead of becoming `"undefined"`.
- **Object search values** (including `Date`) now throw instead of being JSON-stringified.
- **Validation moved to setup:** invalid templates now throw when `jetPaths()` is called instead of when a route is called. The rules also changed: UUIDs, slugs, kebab-case and `snake_case` query keys are all allowed now, while query strings inside templates are not.
- **Return types:** calls with arguments are now typed as `string` instead of the unformatted template literal.

<p align="center">· · ·</p>

## 📄 License

MIT © [seanpmaxwell](LICENSE)

Happy web deving! 🚀
