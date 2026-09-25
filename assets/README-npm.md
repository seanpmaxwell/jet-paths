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

Please refer to the official <a href="https://github.com/seanpmaxwell/jet-paths">github repo</a> for the most up-to-date documentation.
