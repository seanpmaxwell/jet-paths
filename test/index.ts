/**
 * Test it works :)
 */

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
