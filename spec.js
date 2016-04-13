'use strict';
/* global describe, it, beforeEach  */
const assert = require('assert'),
  http = require('http'),
  once = require('once'),
  example = require('./example'),
  terminator = require('./terminator');

let terminated,
  error,
  errorNoThrow,
  clientError,
  fast,
  slow;

describe('terminator', function() {
  beforeEach(function() {
    const server = example({timeout: 3000});
    const connection = server.listen();
    const port = connection.address().port;

    terminated = false;
    terminator.terminate = once(function() {
      terminated = true;
      connection.close();
    });

    error = {
      host: 'localhost',
      port: port,
      path: '/error'
    };

    errorNoThrow = {
      host: 'localhost',
      port: port,
      path: '/error-nothrow'
    };

    clientError = {
      host: 'localhost',
      port: port,
      path: '/client-error'
    };

    fast = {
      host: 'localhost',
      port: port,
      path: '/fast'
    };

    slow = {
      host: 'localhost',
      port: port,
      path: '/slow'
    };
  });

  it('does not emit on client errors', function(done) {
    http.get(clientError, function() {
      try {
        assert(terminated === false, 'should not have been terminated');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('does not emit on explicit error status codes', function(done) {
    http.get(errorNoThrow, function(res) {
      try {
        assert.equal(res.statusCode, 503);
        assert(terminated === false, 'should not have been terminated');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('emits terminate event', function(done) {
    http.get(error, function() {
      try {
        assert(terminated);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('refuses new connections', function(done) {
    this.timeout(6000);
    this.slow(4000);

    http.get(error, function(res) {
      assert.equal(res.statusCode, 500);
      http.get(fast, function() {
        done(new Error('Should not reach here'));
      })
      .on('error', function() {
        done();
      });
    });
  });

  it('completes existing requests', function(done) {
    this.timeout(6000);
    this.slow(4000);

    http.get(slow, function(res) {
      try {
        assert(terminated);
        assert.equal(res.statusCode, 200);
        done();
      } catch (err) {
        done(err);
      }
    });

    http.get(error);
  });

  it('stops keepalive connections', function(done) {
    this.timeout(6000);
    this.slow(4000);

    fast.agent = new http.Agent({keepAlive: true});

    http.get(fast, function() {
      http.get(error, function() {
          http.get(fast, function() {
            done(new Error('Should not reach here'));
          })
          .on('error', function() {
            done();
          });
        });
    });
  });
});
