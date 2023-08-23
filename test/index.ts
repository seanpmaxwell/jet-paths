/**
 * Test it works :)
 */

import jetPaths from '../src';


const PREFIX = 'Root';

const Paths = {
  [PREFIX]: '/api',
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

const pathsFull = jetPaths(Paths, PREFIX);
console.log(pathsFull.Users.Delete);
