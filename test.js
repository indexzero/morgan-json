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
  empty:  function () { return null },
};

//
// Invalid argument message that morgan-json outputs.
//
var invalidMsg = 'argument format must be a string or an object';

describe('morgan-json', function () {
  describe('string tokens', function () {
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

    it('defaults to "-"', function () {
      var compiled = json({
        simple: ':empty',
        withTrailer: ':empty thing',
        withPrefix: 'some :empty',
        withBoth: 'some :empty thing',
        withMultipleValues: ':method :empty :status'
      });

      var output = compiled(mock);
      assume(output).deep.equals(JSON.stringify({
        simple: '-',
        withTrailer: '- thing',
        withPrefix: 'some -',
        withBoth: 'some - thing',
        withMultipleValues: 'method - status'
      }));
    })
  });

  describe('object tokens', function () {
    const typedMock = {
      method: function () { return 'method' },
      url:    function () { return 'url' },
      status: function () { return 200 },
      res:    function (req, res, arg) { return ['res', arg].join(' ') },
      req:    function (req, res, arg) { return ({
        'content-length': 123,
        'accept-lang': '5.67',
        none: null
      })[arg] },
      'response-time': function () { return 9.001 },
      numString: function () { return "404" },
      empty:  function () { return null },
    };

    describe('type support', function () {
      it('accepts object tokens', function () {
        var compiled = json({
          method: {
            value: ':method'
          },
          url: {
            value: ':url'
          },
          status: {
            value: ':status'
          },
          'response-time': {
            value: ':response-time'
          },
          'request-size': {
            value: ':req[content-length]'
          }
        });
        
        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          method: 'method',
          url: 'url',
          status: '200',
          'response-time': '9.001',
          'request-size': '123'
        }));
      });

      it('can mix string and object tokens', function () {
        var compiled = json({
          method: ':method',
          url: {
            value: ':url'
          },
          status: ':status',
          'response-time': ':response-time',
          'request-size': ':req[content-length]'
        });
        
        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          method: 'method',
          url: 'url',
          status: '200',
          'response-time': '9.001',
          'request-size': '123'
        }));
      });

      it('allows type="*"', function () {
        var compiled = json({
          method: {
            value: ':method',
            type: '*'
          },
          url: {
            value: ':url',
            type: '*'
          },
          status: {
            value: ':status',
            type: '*'
          },
          'response-time': {
            value: ':response-time',
            type: '*'
          },
          'request-size': {
            value: ':req[content-length]',
            type: '*'
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          method: 'method',
          url: 'url',
          status: 200,
          'response-time': 9.001,
          'request-size': 123
        }));
      });

      it('allows type="string"', function () {
        var compiled = json({
          method: {
            value: ':method',
            type: 'string'
          },
          url: {
            value: ':url',
            type: 'string'
          },
          status: {
            value: ':status',
            type: 'string'
          },
          'response-time': {
            value: ':response-time',
            type: 'string'
          },
          'request-size': {
            value: ':req[content-length]',
            type: 'string'
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          method: 'method',
          url: 'url',
          status: '200',
          'response-time': '9.001',
          'request-size': '123'
        }));
      });

      it('allows mixed types', function () {
        var compiled = json({
          status: {
            value: ':status',
            type: 'string'
          },
          'response-time': {
            value: ':response-time',
            type: '*'
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          status: '200',
          'response-time': 9.001
        }));
      });

      it('throws on invalid types', function () {
        var error;
        try {
          json({
            method: {
              value: ':method',
              type: 'not-supported'
            }
          });
        } catch(err) {
          error = err;
        }

        assume(error).to.exist();
        assume(error.message).equals('invalid "type" specified for property: method')
      });

      it('can do math when type="*"', function () {
        var compiled = json({
          maths: {
            value: ':status + :response-time',
            type: '*'
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          maths: 200 + 9.001
        }));
      });

      it('can support type conversion', function () {
        var compiled = json({
          number: {
            value: ':numString',
            type: function (val, name) {
              assume(name).equals('numString');
              return parseInt(val, 10);
            } 
          },
          another: {
            value: ':req[accept-lang]',
            type: function (val, name, arg) {
              assume(name).equals('req');
              assume(arg).equals('accept-lang');
              return parseFloat(val);
            } 
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          number: 404,
          another: 5.67
        }));
      });
    });

    describe('default values', function () {
      it('defaults to "-" when no default provided', function () {
        var compiled = json({
          empty: {
            value: ':empty'
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          empty: '-'
        }));
      });

      it('can provide other defaults', function () {
        var compiled = json({
          empty: {
            value: ':empty',
            defaultValue: 'N/A'
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          empty: 'N/A'
        }));
      });

      it('defaults when type="*"', function () {
        var compiled = json({
          empty: {
            value: ':empty',
            type: '*'
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          empty: '-'
        }));
      });

      it('can provide other defaults when type="*"', function () {
        var compiled = json({
          empty: {
            value: ':empty',
            type: '*',
            defaultValue: 0
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          empty: 0
        }));
      });

      it('can defaults when type conversion', function () {
        var compiled = json({
          empty: {
            value: ':req[none]',
            type: function (val, name, arg) {
              assume(name).equals('req');
              assume(arg).equals('none');
              return val && parseFloat(val);
            }
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          empty: '-'
        }));
      });

      it('can provide other defaults when type conversion', function () {
        var compiled = json({
          empty: {
            value: ':req[none]',
            type: function (val, name, arg) {
              assume(name).equals('req');
              assume(arg).equals('none');
              return val && parseFloat(val);
            },
            defaultValue: 987
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          empty: 987
        }));
      });

      it('can specify noDefault type="string" to get empty string', function () {
        var compiled = json({
          empty: {
            value: ':empty',
            type: 'string',
            noDefault: true
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          empty: ''
        }));
      });

      it('can specify no default when type="*"', function () {
        var compiled = json({
          empty: {
            value: ':empty',
            type: '*',
            noDefault: true
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          empty: null
        }));
      });

      it('can specify no default when type conversion', function () {
        var compiled = json({
          empty: {
            value: ':req[none]',
            type: function (val, name, arg) {
              assume(name).equals('req');
              assume(arg).equals('none');
              return val && parseFloat(val);
            },
            noDefault: true
          }
        });

        var output = compiled(typedMock);
        assume(output).deep.equals(JSON.stringify({
          empty: null
        }));
      });
    });
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
