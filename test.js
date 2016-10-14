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

});
