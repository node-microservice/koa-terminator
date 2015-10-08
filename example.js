var http = require('http'),
  koa = require('koa'),
  route = require('koa-route'),
  error = require('koa-error'),
  terminator = require('./terminator');

function example() {
  var app = koa();

  app.use(error());
  app.use(terminator());
  app.use(route.get('/fast', function* () {
    this.status = 200;
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

  return http.createServer(app.callback());
}

module.exports = example;

if (require.main === module) {
  var server = example();
  server.listen(8888);
}
