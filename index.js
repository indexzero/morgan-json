'use strict';

/**
 * Compile a format string into a function.
 *
 * Adopted from `morgan.compile` from `morgan` under MIT.
 *
 * @param {string} format
 * @return {function}
 * @public
 */
module.exports = function compile (format) {
  if (typeof format !== 'string') {
    throw new TypeError('argument format must be a string')
  }

  var fmt = format.replace(/"/g, '\\"')
  var js = '  "use strict"\n  return JSON.stringify({' + fmt.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?([^:]+)?/g, function (_, name, arg, offset, str) {
    var tokenName = String(JSON.stringify(name))
    var tokenArguments = 'req, res'
    var tokenFunction = 'tokens[' + tokenName + ']'

    if (arg !== undefined) {
      tokenArguments += ', ' + String(JSON.stringify(arg))
    }

    return '\n    ' + tokenName + ': (' + tokenFunction + '(' + tokenArguments + ') || "-"),'
  }) + '\n  })'

  // eslint-disable-next-line no-new-func
  return new Function('tokens, req, res', js)
}
