var cluster = require('cluster'),
  once = require('once'),
  onFinished = require('on-finished');

module.exports = function(server, config) {
  config = config || {};

  var terminate = once(function(err) {
    if (config.timeout === undefined || config.timeout) {
      setTimeout(function() {
        module.exports._exit();
      }, config.timeout || 10000).unref();
    }

    if (cluster.isWorker) {
      cluster.worker.disconnect();
    }

    server.close();
    server.unref();
    process.emit('terminated');
  });

  if (config.uncaughtException === undefined || config.uncaughtException) {
    process.once('uncaughtException', function(err) {
      terminate();
    });
  }

  return function(req, res, next) {
    req.connection.ref();

    if (terminate.called) {
      res.set('Connection', 'close');
      res.status(503).end();
      return;
    }

    onFinished(res, function(err, res) {
      req.connection.unref();

      if (err || res.statusCode > 499) {
        terminate();
      }
    });

    next();
  };
};

module.exports._exit = function() {
  process.exit(1);
};
