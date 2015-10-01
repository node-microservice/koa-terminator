var assert = require('assert'),
  http = require('http'),
  example = require('./example'),
  terminator = require('./terminator');

var exit,
  closed,
  error,
  fast,
  slow,
  never;

terminator._exit = function() {
  exit = true;
};

describe('terminator', function() {
  beforeEach(function() {
    closed = false;
    exit = false;
    var server = example({timeout: 3000});
    var port = server.listen().address().port;

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

    never = {
      host: 'localhost',
      port: port,
      path: '/never'
    };

    server.once('close', function() {
      closed = true;
    });
  });

  it('closes the server', function(done) {
    http.get(error, function() {
      try {
        assert(closed);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('refuses new connections', function(done) {
    this.timeout(6000);
    this.slow(4000);

    http.get(error, function() {
      http.get(fast, function(res) {
        done(new Error('Should not be called'));
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
        assert(closed);
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
          http.get(fast)
          .on('error', function() {
            done();
          });
        });
    });
  });

  it('exit after timeout', function(done) {
    this.slow(10000);
    this.timeout(12000);

    http.get(never);
    http.get(error, function() {
      setTimeout(function() {
        try {
          assert(exit);
          done();
        } catch (err) {
          done(err);
        }
      }, 4000);
    });
  });
});
