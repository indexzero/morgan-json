'use strict';

var assume = require('assume');
var morgan = require('morgan');
var json = require('./');

//
// A simple mock "morgan" object which returns deterministic
// output from the defined functions.
//
var mock = {
  method: function () { return 'method' },
  url:    function () { return 'url' },
  status: function () { return 'status' },
  res:    function (req, res, arg) { return ['res', arg].join(' ') },
  'response-time': function () { return 'response-time' },
};

//
// Invalid argument message that morgan-json outputs.
//
var invalidMsg = 'argument format must be a string or an object';

describe('morgan-json', function () {
  it('format string of all tokens', function () {
    var compiled = json(':method :url :status :res[content-length] :response-time');
    var output = compiled(mock);

    assume(output).deep.equals(JSON.stringify({
      method: 'method',
      url: 'url',
      status: 'status',
      res: 'res content-length',
      'response-time': 'response-time'
    }));
  });

  it('format string of all tokens (with trailers)', function () {
    var compiled = json(':method :url :status :res[content-length] bytes :response-time ms');
    var output = compiled(mock);

    assume(output).deep.equals(JSON.stringify({
      method: 'method',
      url: 'url',
      status: 'status',
      res: 'res content-length bytes',
      'response-time': 'response-time ms'
    }));
  });

  it('format object of all single tokens (no trailers)', function () {
    var compiled = json({
      method: ':method',
      url: ':url',
      status: ':status',
      'response-time': ':response-time',
      length: ':res[content-length]'
    });

    var output = compiled(mock);
    assume(output).deep.equals(JSON.stringify({
      method: 'method',
      url: 'url',
      status: 'status',
      'response-time': 'response-time',
      length: 'res content-length'
    }))
  });

  it('format object with multiple tokens', function () {
    var compiled = json({
      short: ':method :url :status',
      'response-time': ':response-time',
      length: ':res[content-length]'
    });

    var output = compiled(mock);
    assume(output).deep.equals(JSON.stringify({
      short: 'method url status',
      'response-time': 'response-time',
      length: 'res content-length'
    }));
  });

  it('format object of all tokens (with trailers)', function () {
    var compiled = json({
      method: 'GET :method',
      url: '-> /:url',
      status: 'Code :status',
      'response-time': ':response-time ms',
      length: ':res[content-length]'
    });

    var output = compiled(mock);
    assume(output).deep.equals(JSON.stringify({
      method: 'GET method',
      url: '-> /url',
      status: 'Code status',
      'response-time': 'response-time ms',
      length: 'res content-length'
    }));
  });

  describe('{ stringify: false }', function () {
    it('format object returns an object', function () {
      var compiled = json({
        short: ':method :url :status',
        'response-time': ':response-time',
        length: ':res[content-length]'
      }, { stringify: false });

      var output = compiled(mock);
      assume(output).is.an('object');
      assume(output).deep.equals({
        short: 'method url status',
        'response-time': 'response-time',
        length: 'res content-length'
      });
    });

    it('format string returns an object', function () {
      var compiled = json(':method :url :status', { stringify: false });

      var output = compiled(mock);
      assume(output).is.an('object');
      assume(output).deep.equals({
        method: 'method',
        url: 'url',
        status: 'status'
      });
    });
  });

  describe('Invalid arguments', function () {
    it('throws with null', function () {
      assume(function () { json(null); }).throws(invalidMsg);
    });

    it('throws with Boolean', function () {
      assume(function () { json(false); }).throws(invalidMsg);
      assume(function () { json(true); }).throws(invalidMsg);
    });

    it('throws with Number', function () {
      assume(function () { json(0); }).throws(invalidMsg);
      assume(function () { json(1); }).throws(invalidMsg);
      assume(function () { json(Number.MAX_VALUE); }).throws(invalidMsg);
      assume(function () { json(Number.POSITIVE_INFINITY); }).throws(invalidMsg);
    });

    it('throws with empty string', function () {
      assume(function () { json(''); }).throws('argument format string must not be empty');
    });
  });
});
