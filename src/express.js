const { errors } = require('./errors');
/**
 * This is  custom error handler for express.  It just gives us a little more control over the output.
 *
 * @param {boolean} options - True if the custom error handler should include the stack.
 * @returns {function(boolean)} - The custom error handler middleware.
 */
const errorHandler = (options) => defaultFormatter(options);

// noinspection JSUnusedLocalSymbols
/**
 * This is the default formatter that express.send() and middleware will use.
 *
 * @param {object} options - TODO:
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
