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

``` json
{"short":"GET / 200","length":"200","response-time":"2 ms"}
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

``` json
{"short":"GET / 200","length":"200","response-time":"2 ms"}
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

``` json
{"method":"GET","url":"/","status":"200","res":"10 bytes","response-time":"2 ms"}
```

### Returning strings vs. Objects

By default functions returned by `morgan-json` will return strings from `JSON.stringify`. In some
cases you may want object literals (e.g. if you perform stringification in another layer of your logger). In this case just provide `{ stringify: false }`:

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

Will output a JSON object that has keys:

``` json
{"method":"GET","url":"/","status":"200"}
```

### Token options

When using [Format objects](#format-objects), you can also specify options for each property by provide an object rather than a string

``` js
const morgan = require('morgan');
const json = require('morgan-json');

const format = json({
  method: {
    value: ':method'
  },
  'req-length': {
    value: ':req[content-length]'
  },
  'response-time': {
    value: ':response-time ms'
  }
});

app.use(morgan(format));
```

Will output a JSON object that has keys `method`, `req-length` and `response-time`:

``` json
{"method":"GET","req-length":"16536","response-time":"2 ms"}
```

#### `type` option

By default `morgan-json` assumes that all property values in the resulting json object should be strings. You can allow for the original value to pass-through by specifying a `type` token option. If no `type` token option is specified, it is assumed to be `string`.

``` js
const morgan = require('morgan');
const json = require('morgan-json');

const format = json({
  method: {
    value: ':method',
    type: 'string'
  },
  'req-length': {
    value: ':req[content-length]',
    type: '*'
  },
  'response-time': {
    value: ':response-time',
    type: '*'
  }
});

app.use(morgan(format));
```

Will output a JSON object that has keys `method`, `req-length` and `response-time` (note that `req-length` is still a string since it's reading a header value that is usually typed as a string):

``` json
{"method":"GET","req-length":"16536","response-time":2}
```

##### `type` converter options

You can also specify a type converter to be used to output the value for a token. This can be useful when reading values that may be typed as a string.

``` js
const morgan = require('morgan');
const json = require('morgan-json');

const format = json({
  method: {
    value: ':method',
    type: 'string'
  },
  'req-length': {
    value: ':req[content-length]',
    type: function(value, tokenName, tokenArg) {
      // `tokenName` will be 'req'
      // `tokenArg` will be 'content-length'
      if (typeof value === 'string') {
        return parseInt(value, 10);
      }
      return value;
    }
  },
  'response-time': {
    value: ':response-time',
    type: '*'
  }
});

app.use(morgan(format));
```

Will output a JSON object that has keys `method`, `req-length`:

``` json
{"method":"GET","req-length":16536}
```

#### `defaultValue` option

By default `morgan-json` defaults tokens to `"-"` if there is a falsy value. You can use the `defaultValue` token option to change that.

``` js
const morgan = require('morgan');
const json = require('morgan-json');

const format = json({
  method: {
    value: ':method'
  },
  'req-length': {
    value: ':req[content-length]'
  },
  'req-length-default': {
    value: ':req[content-length]',
    defaultValue: '0'
  }
});

app.use(morgan(format));
```

Assuming there was no `content-length` header on the request, this will output a JSON object that has keys `method`, `req-length` and `req-length-default`:

``` json
{"method":"GET","req-length":"-","req-length-default":"0"}
```

#### `noDefault` option

If you do not want a default value, you can use the `noDefault` token option to specify that. However, if the resulting type should be a string, the token will be an empty string rather than `null` or `undefined`.

``` js
const morgan = require('morgan');
const json = require('morgan-json');

const format = json({
  method: {
    value: ':method'
  },
  'req-length': {
    value: ':req[content-length]'
  },
  'req-length-no-default': {
    value: ':req[content-length]',
    noDefault: true
  },
  'req-length-number': {
    value: ':req[content-length]',
    type: '*',
    noDefault: true
  }
});

app.use(morgan(format));
```

Assuming there was no `content-length` header on the request, this will output a JSON object that has keys `method`, `req-length` and `req-length-default`:

``` json
{"method":"GET","req-length":"-","req-length-no-default":"","req-length-number":null}
```

## Tests

``` sh
npm test
```

##### LICENSE: MIT
##### AUTHOR: [Charlie Robbins](https://github.com/indexzero)
