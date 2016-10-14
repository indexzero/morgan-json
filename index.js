'use strict';

var debug = require('diagnostics')('morgan-json');

/**
 * Compile a `morgan` format string into a `morgan` format function
 * that returns JSON.
 *
 * Adopted from `morgan.compile` from `morgan` under MIT.
 *
 * @param {string|Object} format
 * @return {function}
 * @public
 */
module.exports = function compile (format) {
  if (typeof format !== 'string') {
    return compileObject(format);
  }

  var fmt = format.replace(/"/g, '\\"')
  var js = '  "use strict"\n  return JSON.stringify({' + fmt.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?([^:]+)?/g, function (_, name, arg, trail, offset, str) {
    var tokenName = String(JSON.stringify(name))
    var tokenArguments = 'req, res'
    var tokenFunction = 'tokens[' + tokenName + ']'
    var trailer = (trail || '').trimRight();

    if (arg !== undefined) {
      tokenArguments += ', ' + String(JSON.stringify(arg))
    }

    return '\n    ' + tokenName + ': (' + tokenFunction + '(' + tokenArguments + ') || "-") + ' + JSON.stringify(trailer) + ','
  }) + '\n  })'

  debug('\n%s', js);

  // eslint-disable-next-line no-new-func
  return new Function('tokens, req, res', js)
}

/**
 * Compile an Object with keys as `morgan` format strings into a `morgan` format function
 * that returns JSON. The JSON returned will have the same keys as the format Object.
 *
 * Adopted from `morgan.compile` from `morgan` under MIT.
 *
 * @param {string|Object} format
 * @return {function}
 * @public
 */
function compileObject (format) {
  if (!format || typeof format !== 'object') {
    throw new Error('argument format must be a string or an object');
  }
};
