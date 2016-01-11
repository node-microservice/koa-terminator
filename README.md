# microservice / terminator
shuts down the server if an error occurs. tries to be nice about it.

## usage

first, register the middleware

```javascript
const terminator = require('@microservice/koa-terminator');

app.use(require('koa-error')); // this can come before
app.use(terminator())
// everything else comes after
```

then, listen for a `terminate` event

```javascript
const server = app.listen();

process.on('terminate', () => {
  // the process will exit once existing connections are done
  server.close();
  // you could use a timeout here to force shutdown as well.
  const timer = setTimeout(() => {
    process.exit(1);
  }, 5000);
  timer.unref();
})
```
