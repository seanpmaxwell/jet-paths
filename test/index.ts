import jetPaths from '../src/index.js';


const PREFIX = 'Base';

const Paths = {
  Base: '/api',
  Users: {
    [PREFIX]: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Posts: {
    [PREFIX]: '/posts',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    Misc: '/misc/:id/something/:foo',
    Else: '/misc/:id/something/foo',
    Private: {
      [PREFIX]: '/private',
      Get: '/all',
      Delete: '/delete/:id',
    },
  },
} as const;

const pathsFull = jetPaths(Paths, 'Base');
pathsFull.Posts.Add 
console.log(pathsFull.Posts.Delete({ id: 5, foo: 'bar' }));
console.log(pathsFull.Posts.Misc({ foo: 'bar', id: 67 }));
console.log(pathsFull.Posts.Else({ foo: 'bar', id: 34 }));
console.log(pathsFull.Posts.Else());

// Setup Vite Testing too
// console.log(pathsFull);
