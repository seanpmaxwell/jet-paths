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
    Private: {
      [PREFIX]: '/private',
      Get: '/all',
      Delete: '/delete/:id',
    },
  },
} as const;

const pathsFull = jetPaths(Paths, 'Base');
pathsFull.Posts.Add 
console.log(pathsFull);
