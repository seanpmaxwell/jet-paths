# About jet-paths

In my expressJS server, I would generally store my routes in an object like so 
and pass them to the express `Router()` objects:

```typescript
// My object
const Paths = {
  Base: '/api',
  Users: {
    Base: '/users',
    Get: '/all',
    Add: '/add',
    ...

// And express router object
userRouter.get(Paths.Uses.Add, (res, rej) => {
  ...
})
```

This worked fine. But for my front-end and my `.spec` tests I needed the full path for each route. I didn't like having to do:

```typescript
const ADD_USERS_PATH = `${Paths.Base/Paths.User.Base/Paths.Users.Add}`,
  GET_USERS_PATH = `${Paths.Base/Paths.User.Base/Paths.Users.Get}`,
...
```

over and over again. So I decided to write a recursive function that sets this up for me.


#### Installation
- `npm i -s jet-paths`


#### How it works
The default import provides the function `jetPaths(obj, prefix (optional, default is 'BASE'))`. An object with the same keys is return with the prefix added for the parent object and all nested objects. 


#### Sample code:

```typescript
import jetPaths from '../src';

const ROOT_KEY = 'Root';

const Paths = {
  [ROOT_KEY]: '/api',
  Users: {
    [ROOT_KEY]: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Posts: {
    [ROOT_KEY]: '/posts',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    Private: {
      [ROOT_KEY]: '/private',
      Get: '/all',
      Delete: '/delete/:id',
    },
  },
} as const;

console.log(jetPaths(Paths, ROOT_KEY));

// The above code will print out

{
  Root: '/api',
  Users: {
    Root: '/api/users',
    Get: '/api/users/all',
    Add: '/api/users/add',
    Update: '/api/users/update',
    Delete: '/api/users/delete/:id'
  },
  Posts: {
    Root: '/api/posts',
    Get: '/api/posts/all',
    Add: '/api/posts/add',
    Update: '/api/posts/update',
    Delete: '/api/posts/delete/:id',
    Private: {
      Root: '/api/posts/private',
      Get: '/api/posts/private/all',
      Delete: '/api/posts/private/delete/:id'
    }
  }
}

```





Happy web-deving :)
