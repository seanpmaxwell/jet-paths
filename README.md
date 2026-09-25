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
  - Path-variable object is validated using both at runtime and compile time.
- Regular-expression validation ensures URLs conform to a specific format.
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

### Insert path paramters and append search parameters

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
Paths.Users.Search({ query: 's@e.com' }); // "/api/users/search?query=s@e.com"
Paths.Users.Other({ name: 'joe' }, { ids: [1, 2, 3] }); // "/api/users/other/joe/blah?ids=[1,2,3]"
```

<p align="center">· · ·</p>

## ⚡ Quick Start

### Installation

```bash
npm install jet-paths
```

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
Paths.Users.Delete({ id: 1 });
```

<p align="center">· · ·</p>

## 📥 Key behaviors to note

- You may pass an object/s or no arguments at all when calling a URL function.
- Keys in the function-argument object for path-variables must match path-variable names.
  - i.e, if the path is `/api/users/:id` object must be `{ id: 5 }`.
- All paths must start with a forward-slash `/`.
- Nested objects are functions too: calling one returns its full base URL (i.e. `Paths.Users()`), and its child routes are properties on it.
- The `._` property is always the partial path from the original object, not the full URL (i.e. `Paths.Users.One._` is `'/:id'`).
- A values for path-parameters must be a primitive type: i.e. `string | number | boolean | undefined | null`.
- A values for search-parameters must be a primitive type or an array of primitives.
  - If you want to pass an object (other than arrays) to a search parameter, you must stringify it first.
- Regex validation happens after values are inserted/appended (exluding the `prepend` value).
- Function parameters are optional in case you want to return the original string (i.e. testing)
  - If there are path-variables and the path-variables argument is `undefined`, regex validation is skipped.
  - Calling the function with no arguments returns the unformatted URL.

<p align="center">· · ·</p>

## ⚙️ Options

#### `prepend:` (`string` | `undefined`, default: `undefined`)

Prepends a string to the beginning of every route. While this can also be achieved via the root `_` key, passing a non-constant value here will cause type information to be lost.

> Note: routes in the object are regex validated; however, the `prepend` value is not.

#### `disableRegex:` (`boolean` | `undefined`, default: `false`)

Disables regular-expression check at the end of each function call.

<p align="center">· · ·</p>

## 📄 License

MIT © [seanpmaxwell1](LICENSE)

Happy web deving! 🚀
