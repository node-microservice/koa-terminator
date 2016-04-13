const http = require('http'),
  httpError = require('http-errors'),
  koa = require('koa'),
  route = require('koa-route'),
  error = require('koa-error'),
  terminator = require('./terminator');

function example() {
  const app = koa();

  app.use(error());
  app.use(terminator());
  app.use(route.get('/fast', function* () {
    this.status = 200;
  }));
  app.use(route.get('/client-error', function* () {
    throw new httpError.BadRequest();
  }));
  app.use(route.get('/slow', function* () {
    yield new Promise(function(resolve) {
      setTimeout(function() {
        resolve();
      }, 2000);
    });
    this.status = 200;
  }));
  app.use(route.get('/never', function* () {
    throw new Error('should not be caled');
  }));
  app.use(route.get('/error', function* () {
    throw new Error();
  }));
  app.use(route.get('/error-nothrow', function* () {
    this.status = 503;
  }));

  return http.createServer(app.callback());
}

module.exports = example;

if (require.main === module) {
  const server = example();
  server.listen(8888);
}
