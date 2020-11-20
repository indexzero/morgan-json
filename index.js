'use strict';

var debug = require('diagnostics')('morgan-json');

/**
 * Compile a `morgan` format string into a `morgan` format function
 * that returns JSON.
 *
 * Adopted from `morgan.compile` from `morgan` under MIT.
 *
 * @param {string|Object} format
 * @param {Object} opts Options for how things are returned.
 *   - 'stringify': (default: true) If false returns an object literal
 * @return {function}
 * @public
 */
module.exports = function compile (format, opts) {
  if (format === '') {
    throw new Error('argument format string must not be empty');
  }

  if (typeof format !== 'string') {
    return compileObject(format, opts);
  }

  opts = opts || {};

  var fmt = format.replace(/"/g, '\\"');
  var stringify = opts.stringify !== false ? 'JSON.stringify' : '';
  var js = '  "use strict"\n  return ' + stringify + '({' + fmt.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?([^:]+)?/g, function (_, name, arg, trail, offset, str) {
    var tokenName = String(JSON.stringify(name));
    var tokenArguments = 'req, res';
    var tokenFunction = 'tokens[' + tokenName + ']';
    var trailer = (trail || '').trimRight();

    if (arg !== undefined) {
      tokenArguments += ', ' + String(JSON.stringify(arg));
    }

    return '\n    ' + tokenName + ': (' + tokenFunction + '(' + tokenArguments + ') || "-") + ' + JSON.stringify(trailer) + ','
  }) + '\n  })';

  debug('\n%s', js);

  // eslint-disable-next-line no-new-func
  return new Function('tokens, req, res', js);
}

/**
 * Compile an Object with keys as `morgan` format strings into a `morgan` format function
 * that returns JSON. The JSON returned will have the same keys as the format Object.
 *
 * Adopted from `morgan.compile` from `morgan` under MIT.
 *
 * @param {Object} format
 * @param {Object} opts Options for how things are returned.
 *   - 'stringify': (default: true) If false returns an object literal
 * @return {function}
 * @public
 */
function compileObject (format, opts) {
  if (!format || typeof format !== 'object') {
    throw new Error('argument format must be a string or an object');
  }

  opts = opts || {};

  var keys = Object.keys(format);
  var stringify = opts.stringify !== false ? 'JSON.stringify' : '';
  var conversionFunctions = Object.create(null);
  var js = '  "use strict"\n  return ' + stringify + '({' + keys.map(function (key, i) {
    var token = Object.assign(
      { type: 'string', defaultValue: '-', required: true },
      (typeof format[key] === 'object') ? format[key] : {
        value: format[key]
      });

    var getValue = getValueByType[token.type];
    if (typeof token.type === 'function') {
      getValue = getTypeConvertedValue;
      conversionFunctions[key] = token.type;
    }
    if (!getValue) {
      throw new Error('invalid "type" specified for property: ' + key);
    }

    var assignment = '\n    "' + key + '": ' + getValue(token, key);

    return assignment;
  }) + '\n  })';

  debug('\n%s', js);

  // eslint-disable-next-line no-new-func
  return new Function('convert, tokens, req, res', js).bind(null, conversionFunctions);
};

var getValueByType = {
  'string': getStringValue,
  '*': getPassthroughValue
};

function getStringValue(token) {
  return getValue(token, {
    prefix: '"',
    postfix: '"',
    preToken: '" + (',
    postTokenValue: ') + "',
    noDefaultValue: ' || ""'
  });
}

function getPassthroughValue(token) {
  return getValue(token);
}

function getTypeConvertedValue(token, key) {
  return getValue(token, {
    preToken: '(convert["' + key + '"](',
    postToken: function (name, arg) {
      var nameString = String(JSON.stringify(name));
      var convertArgs = ', ' + nameString;
  
      if (arg !== undefined) {
        convertArgs += ', ' + String(JSON.stringify(arg));
      }
      return convertArgs + ')';
    },
    postTokenValue: ')'
  });
}

function getValue(token, opts) {
  opts = opts || {};
  var prefix = opts.prefix || '';
  var postfix = opts.postfix || '';
  var preToken = opts.preToken || '(';
  var postToken = opts.postToken || function () { return ''; }
  var postTokenValue = opts.postTokenValue || ')';
  var noDefaultValue = opts.noDefaultValue || '';

  var assignment = prefix + token.value.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?/g, function (_, name, arg) {
    var tokenArguments = 'req, res';
    var tokenFunction = 'tokens[' + String(JSON.stringify(name)) + ']';

    if (arg !== undefined) {
      tokenArguments += ', ' + String(JSON.stringify(arg));
    }

    var defaultValue = token.noDefault ? 
      noDefaultValue : 
      ' || ' + JSON.stringify(token.defaultValue);
    return preToken + tokenFunction + '(' + tokenArguments + ')' + postToken(name, arg) + defaultValue + postTokenValue;
  }) + postfix;

  return assignment;
}

