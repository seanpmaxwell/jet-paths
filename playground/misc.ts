import logger from 'jet-logger';

import jetPaths from '@src/api/jetPaths';

import onInit from '../scripts/onInit';

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

onInit.sync(() => {
  const Paths = jetPaths({
    $path: '/api',
    Users: {
      $path: '/users',
      Search: '/search?<name!><email>',
      Search2: '/search2?<foo>',
      Search3: '/:id/search3?<foo!>',
      Dogs: {
        $path: '/dogs',
        One: '/one/:id?<name!>',
      },
    },
  });

  const url1 = Paths.Users.Search({ name: 'foo', email: 'bar' });
  logger.info(url1); // /api/users/search?name=foo&email=bar

  Paths.Users.Dogs.One({ id: 5 }, { name: 5 });
  logger.info(Paths.Users.Dogs.One.$tmpl); // /api/users/dogs/one/:id

  // @ts-expect-error - `name` is missing
  const cb1 = () => Paths.Users.Search({ email: 'foo' });
  logger.catch(cb1);

  // @ts-expect-error - `name` is missing
  const cb1a = () => Paths.Users.Search();
  logger.catch(cb1a);

  const url2 = Paths.Users.Search2();
  logger.info(url2);

  // @ts-expect-error - unknown key
  const cb2a = () => Paths.Users.Search2({ horse: 'dog' });
  logger.catch(cb2a);

  // @ts-expect-error - Path Param key missing
  const cb3a = () => Paths.Users.Search3({ foo: 'dog' });
  logger.catch(cb3a);

  // @ts-expect-error - Search Param key missing
  const cb3b = () => Paths.Users.Search3({ id: 5 });
  logger.catch(cb3b);

  const url3 = Paths.Users.Search3({ id: 5 }, { foo: 'bar' });
  logger.info(url3);

  logger.info(Paths.Users.Search3.$tmpl + ',', Paths.Users.Search3.$path);
});
