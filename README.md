# jet-paths ✈️

[![npm version](https://img.shields.io/npm/v/jet-paths.svg)](https://www.npmjs.com/package/jet-paths)
[![npm downloads](https://img.shields.io/npm/dm/jet-paths.svg)](https://www.npmjs.com/package/jet-paths)
[![TypeScript](https://img.shields.io/badge/TypeScript-✔-blue)](https://www.typescriptlang.org/)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jet-paths?label=bundle&color=0f172a)](https://bundlephobia.com/package/jet-paths)
[![License](https://img.shields.io/npm/l/jet-paths.svg)](LICENSE)

> A type-safe utility for defining, composing, and formatting URL paths using nested objects.

Recursively formats an object of URLs so that full paths are set up automatically, allowing you to insert path-params and query-params easily and consistently.

At a glance:

```ts
const Paths = jetPaths({
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id',
  },
});

Paths.Users.Get(); // "/api/users/all"
Paths.Users.One(5); // "/api/users/5"
Paths.Users._(); // "/api/users"
```

<br/><b>\*\*\*</b><br/>

## 🤔 Why jet-paths?

- Automatically sets up full URLs using nested objects, avoiding repeated prefixes.
- URLs with parameters are automatically converted into functions for easy value insertion.
- URL functions can insert both path parameters and search parameters using objects.
- Regular expression validation ensures URLs conform to a specific format.
- **TypeScript-first** and fully type-safe.

<p>
  <img src="./assets/vscode-1.png" alt="vscode-1" />
</p>
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

### Insert path paramters

Mark URL parameters using `/:`. Any URL containing a parameter is automatically formatted as a function—both at runtime and compile time.

```ts
const Paths = jetPaths({
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id',
    FooBar: '/foo/:name/bar/:id',
    Search: '/search?query={}',
  },
});

Paths.Users.FooBar({ id: 5, name: 'sean' }); // "/api/users/foo/sean/bar/5"
Paths.Users.Search({ query: 's@e.com' }); // "/api/users/search?query=s@e.com"
```

<br/><b>\*\*\*</b><br/>

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
Paths.Users._(); // "/localhost:3000/api/users"
Paths.Users.Delete({ id: 1 });
```

<br/><b>\*\*\*</b><br/>

## 📥 Passing arguments to URL functions

You may pass an object or no arguments at all when calling a URL function.

Key behaviors to note:

- Keys in the value-object for path segments must match.
- All paths must start with a forward-slash `/`.
- Regex validation happens after values are inserted (exluding the `prepend` value)
- Value objects are optional incase you want to return the original string (i.e. testing)
  - If value objects are `undefined`, regex validation is skipped.
- Calling the function with no arguments returns the unformatted URL.

<br/><b>\*\*\*</b><br/>

## ⚙️ Options

#### `prepend:` (`string` | `undefined`, default: `undefined`)

Prepends a string to the beginning of every route. While this can also be achieved via the root `_` key, passing a non-constant value here will cause type information to be lost.

> Note: routes in the object are regex validated; however, the `prepend` value is not.

#### `disableRegex:` (`boolean` | `undefined`, default: `false`)

Disables regular-expression check at the end of each function call.

<br/><b>\*\*\*</b><br/>

## 📄 License

MIT © [seanpmaxwell1](LICENSE)
<br/>

Happy web deving! 🚀
