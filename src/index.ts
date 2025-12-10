import jetPaths from './setupPaths.js';
export default jetPaths;

const Paths = {
  Root: '/api',
  Users: {
    Root: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Posts: {
    Root: '/posts',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    Private: {
      Root: '/private',
      Get: '/all',
      Delete: '/delete/:id',
    },
  },
} as const;

type TPaths = {
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
