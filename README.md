# ✈️ &nbsp; jet-paths

[![npm version](https://img.shields.io/npm/v/jet-paths.svg)](https://www.npmjs.com/package/jet-paths)
[![npm downloads](https://img.shields.io/npm/dm/jet-paths.svg)](https://www.npmjs.com/package/jet-paths)
[![TypeScript](https://img.shields.io/badge/TypeScript-✔-blue)](https://www.typescriptlang.org/)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jet-paths?label=bundle&color=0f172a)](https://bundlephobia.com/package/jet-paths)
[![License](https://img.shields.io/npm/l/jet-paths.svg)](LICENSE)

Recursively formats an object of URLs so that full paths are set up automatically, allowing you to insert path parameters and append search parameters easily and consistently.

## 📦 Installation

```bash
npm install jet-paths
```

<p align="center">· · ·</p>

## 👀 At a glance

<!-- prettier-ignore -->
```ts
const Paths = jetPaths({
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id',
  },
});

Paths.Users.Get();             // '/api/users/all'
Paths.Users();                 // '/api/users'
Paths.Users._;                 // '/users'
Paths.Users.One({ id: 5 });    // '/api/users/5'
Paths.Users.One({ name: 5 });  // ❌ Type error: 'name' does not exist in type '{ id: Primitive }'
Paths.Users.One._;             // '/:id'
Paths._;                       // '/api'
```

<p align="center">· · ·</p>

## 🤔 Why jet-paths?

- Nested objects become full-URL functions, no repeated prefixes.
- Single source of truth for all your routes
- Every key, including nested objects, is a function; append search params with an object.
- `._` on every function returns the original partial path.
- Path-variables (`/:name`) add a function-argument, type-checked and validated at runtime.
- Path and search values are URL-encoded against injection.
- Route templates are validated once at setup, so typos fail fast.
- **TypeScript-first** and fully type-safe.

<details>
<summary><strong>Keep your routes organized</strong></summary>

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

</details>

<details>
<summary><strong>Insert path parameters and append search parameters</strong></summary>

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

</details>

<p align="center">· · ·</p>

## ⚡ Quick Start

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

## 📥 Other behaviors to note

<details>
<summary><strong>Show list</strong></summary>

- You may pass an object/s or no arguments at all when calling a URL function.
- Keys in the function-argument object for path-variables must match path-variable names.
  - i.e, if the path is `/api/users/:id` object must be `{ id: 5 }`.
  - A path-variable name used more than once (i.e. `/:id/x/:id`) is only passed once and inserted everywhere.
- Nested objects are functions too: calling one returns its full base URL (i.e. `Paths.Users()`), and its child routes are properties on it.
- The `._` property is always the partial path from the original object, not the full URL (i.e. `Paths.Users.One._` is `'/:id'`).
- Route templates are validated once, when `jetPaths()` is called (see `disableRegex`):
  - Every path must start with a forward-slash `/`. Only the `_` key may be an empty string.
  - Static segments may contain letters, numbers, `-`, `.`, `_`, `~` and percent-escapes (i.e. `%20`), but can't be `.` or `..`.
  - Path-variable names may contain letters, numbers and `_`, and must be a whole segment (`/:id`, not `/:idon`).
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

</details>

<p align="center">· · ·</p>

## ⚙️ Options

| Option         | Type                     | Default     | Description                                                                                                                                                                                                                                                       |
| -------------- | ------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prepend`      | `string` \| `undefined`  | `undefined` | Prepends a string to the beginning of every route. While this can also be achieved via the root `_` key, passing a non-constant value here will cause type information to be lost. Note: routes in the object are validated; however, the `prepend` value is not. |
| `disableRegex` | `boolean` \| `undefined` | `false`     | Skips validating the route templates when `jetPaths()` is called. Path and search values are still encoded.                                                                                                                                                       |

<p align="center">· · ·</p>

## 📄 License

MIT © [seanpmaxwell](LICENSE)

Happy web deving! 🚀
