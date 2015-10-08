var once = require('once'),
  onFinished = require('on-finished');

module.exports = function() {
  return function* (next) {
    var ctx = this;

    ctx.request.socket.ref();

    if (module.exports.terminate.called) {
      ctx.headers.Connection = 'close';
      ctx.status = 503;
    } else {
      try {
        onFinished(ctx.res, function() {
          ctx.request.socket.unref();

          if (ctx.status > 499) {
            module.exports.terminate();
          }
        });
        yield* next;
      } catch (err) {
        module.exports.terminate();
        throw err;
      }
    }
  };
};

module.exports.terminate = once(function() {
  process.emit('terminate');
});
