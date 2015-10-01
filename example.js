var http = require('http'),
  express =  require('express'),
  terminator = require('./terminator');

function example(config) {
  var app = express();
  var server = http.createServer(app);

  app.use(terminator(server, config));
  app.use('/fast', function(req, res) {
    res.status(200).end();
  });
  app.use('/slow', function(req, res) {
    setTimeout(function() {
      res.status(200).end();
    }, 2000);
  });
  app.use('/never', function(req, res) {
  });
  app.use('/error', function(req, res, next) {
    next(new Error());
  });
  app.use(function(err, req, res, next) {
    res.status(500).end();
  });

  return server;
}

module.exports = example;

if (require.main === module) {
  var server = example();
  server.listen(8888);
}
