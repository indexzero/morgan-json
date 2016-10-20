# morgan-json

A variant of `morgan.compile` that provides format functions that output JSON

## Usage

``` js
const json = require('morgan-json');
// json(string, opts);
// json(object, opts);
```

To put that into a real world example:

``` js
const morgan = require('morgan');
const express = require('express');
const json = require('morgan-json');

const app = express()
const format = json({
  short: ':method :url :status',
  length: ':res[content-length]',
  'response-time': ':response-time ms'
});

app.use(morgan(format));
app.get('/', function (req, res) {
  res.send('hello, world!')
});
```

When requests to this `express` application come in `morgan` will output a JSON object that looks
like:

```
{"short":"GET / 200","length":200,"response-time":"2 ms"}
```

### Format objects

When provided with an object, `morgan-json` returns a function that will output JSON with keys
for each of the keys in that object. The value for each key will be the result of evaluating each
format string in the object provided. For example:

``` js
const morgan = require('morgan');
const json = require('morgan-json');

const format = json({
  short: ':method :url :status',
  length: ':res[content-length]',
  'response-time': ':response-time ms'
});

app.use(morgan(format));
```

Will output a JSON object that has keys `short`, `length` and `response-time`:

```
{"short":"GET / 200","length":200,"response-time":"2 ms"}
```

### Format strings

When provided with a format string, `morgan-json` returns a function that outputs JSON with keys
for each of the named tokens within the string provided. Any characters trailing after a token
will be included in the value for that key in JSON. For example:

``` js
const morgan = require('morgan');
const json = require('morgan-json');

const format = json(':method :url :status :res[content-length] bytes :response-time ms');

app.use(morgan(format));
```

Will output a JSON object that has keys `method`, `url`, `status`, `res` and `response-time`:

```
{"method":"GET","url":"/","status":"200","res":"10 bytes","response-time":"2 ms"}
```

### Returning strings vs. Objects

By default functions returned by `morgan-json` will return strings from `JSON.stringify`. In some
cases you may want object literals (e.g. if you perform stringification in another layer of your logger). In this case just provide `{ stringify: false }`:

``` js
``` js
const morgan = require('morgan');
const winston = require('winston');
const json = require('morgan-json');

const format = json(':method :url :status', { stringify: false });

app.use(morgan(format, {
  stream: {
    write: function (obj) {
      winston.info(obj);
    }
  }
}));
```

Will output a JSON object that has keys
```

## Tests

```
npm test
```

##### LICENSE: MIT
##### AUTHOR: [Charlie Robbins](https://github.com/indexzero)
