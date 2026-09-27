import logger from 'jet-logger';

import jetPaths from '@src/api/jetPaths';

import onInit from '../scripts/onInit';

// ========================================================================= //
//                                   EXEC                                    //
// ========================================================================= //

onInit.sync(() => {
  const jpaths = jetPaths({
    $path: '/api',
    Users: {
      $path: '/users',
      Search: '/search?<name!><email>',
      Search2: '/search2?<foo>',
      Search3: '/:id/search3?<foo!>',
    },
  } as const);

  const url1 = jpaths.Users.Search({ name: 'foo', email: 'bar' });
  logger.info(url1);

  // @ts-expect-error - `name` is missing
  const cb1 = () => jpaths.Users.Search({ email: 'foo' });
  logger.catch(cb1);

  // @ts-expect-error - `name` is missing
  const cb1a = () => jpaths.Users.Search();
  logger.catch(cb1a);

  const url2 = jpaths.Users.Search2();
  logger.info(url2);

  // @ts-expect-error - unknown key
  const cb2a = () => jpaths.Users.Search2({ horse: 'dog' });
  logger.catch(cb2a);

  // @ts-expect-error - Path Param key missing
  const cb3a = () => jpaths.Users.Search3({ foo: 'dog' });
  logger.catch(cb3a);

  // @ts-expect-error - Search Param key missing
  const cb3b = () => jpaths.Users.Search3({ id: 5 });
  logger.catch(cb3b);

  const url3 = jpaths.Users.Search3({ id: 5 }, { foo: 'bar' });
  logger.info(url3);

  logger.info(jpaths.Users.Search3.$tmpl + ',', jpaths.Users.Search3.$path);
});
