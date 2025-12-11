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
console.log(pathsFull.Posts.Misc({ id: 5, foo: 'bar' }))

// Setup Vite Testing too
// console.log(pathsFull);
