/* global describe, it, beforeEach  */
var assert = require('assert'),
  http = require('http'),
  once = require('once'),
  example = require('./example'),
  terminator = require('./terminator');

var terminated,
  error,
  fast,
  slow;

describe('terminator', function() {
  beforeEach(function() {
    var server = example({timeout: 3000});
    var connection = server.listen();
    var port = connection.address().port;

    terminator.terminate = once(function() {
      terminated = true;
      connection.close();
    });

    error = {
      host: 'localhost',
      port: port,
      path: '/error'
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
