# jet-paths 🧑✈️
> Recursively formats an object of urls, so that full paths are setup automatically and you can quickly insert parameters.
<br/>

```typescript
const Paths = jetPaths({
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id'
  },
});

Paths.Users.Get // value is "/api/users/all"
Paths.Users.One(5) // returns "/api/users/5"
Paths.Users._ // value is "/api/users"
```


## Why jet-paths?

### TypeScript first and fully typesafe!

![vscode-1](./assets/vscode-1.png)
![vscode-2](./assets/vscode-2.png)


### Insert variables into urls using a primitive or object.
- Mark url params as a variable using `/:`. Any URL which contains a variable will be formatted as a function both at runtime and compile time.

```typescript
const Paths = jetPaths({
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    One: '/:id'
    FooBar: '/foo/:name/bar/:id'
  },
});

Paths.Users.FooBar({ id: 5, name: 'sean'}) // returns "/api/users/foo/sean/bar/5"
```


### Keep all your routes organized and avoid repetitive code

- With <b>jet-paths</b> you can keep all the routes for your entire application neetly formattted into one giant object without having repetitive prefixes or needing wrapper functions for routes to insert URL parameters.

> Traditionally, routes are often formatted like this in the snippet below. As you can see, for a large application this can be repetitve and is error prone.
```typescript
const BASE = '/api`;
const BASE_USERS = `${BASE}/users`;
{
  Users: {
    Get: `${BASE_USERS}/all`,
    One: (id: string | number) => `${BASE_USERS}/${id}`,
  },
  ...More routes below
}
```


#### Installation
- `npm i -s jet-paths`


#### Sample code:

```typescript
import jetPaths from 'jet-paths';

const Paths = jetPaths({
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
}, { prepend: 'localhost:3000' });

// The above object will be formatted as:
{
  _: '/localhost:3000/api',
  Users: {
    _: '/localhost:3000/api/users',
    Get: '/localhost:3000/api/users/all',
    Add: '/localhost:3000/api/users/add',
    Update: '/localhost:3000/api/users/update',
    Delete: (args?: TUrlParam | TUrlParams) => '/localhost:3000/api/users/delete/:id'
  },
  Posts: {
    _: '/localhost:3000/api/posts',
    Get: '/localhost:3000/api/posts/all',
    Add: '/localhost:3000/api/posts/add',
    Update: '/localhost:3000/api/posts/update',
    Private: {
      _: '/localhost:3000/api/posts/private',
      Get: '/localhost:3000/api/posts/private/all',
      Delete: (args?: TUrlParam | TUrlParams) => '/localhost:3000/api/posts/private/delete/:foo/bar/:id'
    }
  }
}

Paths.Users._ // "/localhost:3000/api/users"
Paths.Users.Delete // "/localhost:3000/api/users"

```

#### The `prepend:` options

- You can pass the optional `prepend:` option which will prepend a string to the start every route. This could also be done by adding a string to the root level `"_"` property; however, if you pass a non constant values to this property it will loose typesafety and just be formatted as `${string}`.

#### Passing different arguments to a function URL

- You can pass an object, a primitive, or no arguments to a URL function to replace variables with values. Here are some edge cases to keep in mind:
  - If you pass a primitive and there are multiple variables, the primitive will replace every variable.
  - If you pass an object, the object keys must equal a variable in the URL string or they won't replace anything.
  - If you need to access the URL without inserting anything, just called the function with no arguments and an unformatted URL will remain.
  - `null` can be inserted, but you must convert `undefined` to a string first if you want to insert it.

#### The `.insertUrlParams` function

- If you want to insert url parameters outside of your paths object for whatever reason you can import the `insertUrlParams` independently. For efficiency, this function wraps the url and returns another function which insert the variables.

```typescript
import { insertUrlParams } from 'jet-paths';

// Runtime
const formatPath = insertUrlParams('/foo/:name/bar/:id');

// Whenever your API is called
formatPath({ id: 5, name: 'sean'}) // returns "/foo/sean/bar/5"
```


Happy web-deving :)
