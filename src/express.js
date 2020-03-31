const { errors } = require('./errors');

/**
 * This is  custom error handler for express.  It just gives us a little more control over the output.
 *
 * @param {boolean} options - True if the custom error handler should include the stack.
 * @returns {function(boolean)} - The custom error handler middleware.
 * @example
 * const { errors, errorHandler } = require('bc-err');
 * const express = require('express');
 *
 * const app = express();
 *
 * app.get('/brew/coffee', (req, res) => {
 *   throw new errors.HTTP418Error('No coffee for you!');
 * });
 *
 * app.use(errorHandler());
 *
 * app.listen(5000, () => {
 *   console.log('Listening on port 5000');
 * });
 */
const errorHandler = (options) => defaultFormatter(options);

// noinspection JSUnusedLocalSymbols
/**
 * This is the default formatter that express.send() and middleware will use.
 *
 * @param {object} options - A dictionary of options used to control how error object are formatted for the Express response
 * @returns {Function} - The default formatter function.
 * @private
 */
// eslint-disable-next-line no-unused-vars
const defaultFormatter = (options) => (err, req, res, next) => {
  const localOptions = { ...options };
  let localError = err;

  if (!err.isBCError) {
    localError = new errors.HTTP500Error(err, 500);
  }
  res.statusCode = localError.status;

  const accept = req.headers.accept || '';

  const showStack = localOptions.includeStack && (localError.showStack !== undefined && localError.showStack);
  if (accept.includes('json')) {
    res.setHeader('Content-Type', 'application/json');
    const json = { error: localError.toJSON() };
    if (showStack) {
      json.error.stack = localError.stack;
    }
    res.end(JSON.stringify(json));
  } else {
    res.writeHead(res.statusCode, { 'Content-Type': 'text/plain' });
    // noinspection JSCheckFunctionSignatures
    res.end(localError.toString(false) + (showStack ? `\n${localError.stack}` : ''));
  }
};

exports.errorHandler = errorHandler;
