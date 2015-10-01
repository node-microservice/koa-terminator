# microservice / terminator
shuts down the server if an
 error occurs. tries to be nice about it.

## usage

as middleware:

`app.use(terminator(server[, config]))`

see the example below.

### config

#### timer

milliseconds to wait before calling `process.exit(1)`
* type: `number` (can be disabled with `false`)
* default: `5000`

#### uncaughtException

whether or not to terminate on an `uncaughtException` event
* type: `boolean`
* default: `true`

## example

```javascript
var terminator = require('@microservice/terminator');

var http = require('http');
var express = require('express');

var app = express();
var server = http.createServer(app);

app.use(terminator(server, {
  timeout: 10000,
  uncaughtException: true
});
app.use(function(req, res, next) {
  next(new Error());
});

server.listen(80);
```
