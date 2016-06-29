const once = require('once'),
  onFinished = require('on-finished');

module.exports = function() {
  return function* (next) {
    const ctx = this;
    
    try {
      ctx.request.socket.ref();

      onFinished(ctx.res, function() {
        ctx.request.socket.unref();
      });

      yield* next;
    } catch (err) {
      if (typeof err.status === 'undefined' || err.status >= 500) {
        module.exports.terminate();
      }

      throw err;
    } finally {
      if (module.exports.terminate.called) {
        ctx.headers.Connection = 'close';
      }
    }
  };
};

module.exports.terminate = once(function() {
  process.emit('terminate');
});
