const once = require('once'),
  onFinished = require('on-finished');

module.exports = function() {
  return function* (next) {
    try {
      const ctx = this;

      ctx.request.socket.ref();

      onFinished(ctx.res, function() {
        ctx.request.socket.unref();
      });

      if (module.exports.terminate.called) {
        ctx.headers.Connection = 'close';
        ctx.status = 503;
      } else {
        yield* next;
      }
    } catch (err) {
      if (typeof err.status === 'undefined' || err.status >= 500) {
        module.exports.terminate();
      }

      throw err;
    }
  };
};

module.exports.terminate = once(function() {
  process.emit('terminate');
});
