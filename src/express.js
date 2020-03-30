/**
 * This is  custom error handler for express.  It just gives us a little more control over the output.
 *
 * @param {boolean} includeStack - True if the custom error handler should include the stack.
 * @returns {function(boolean)} - The custom error handler middleware.
 */
const errorHandler = (includeStack) => defaultFormatter(includeStack);


// noinspection JSUnusedLocalSymbols
/**
 * This is the default formatter that express.send() and middleware will use.
 *
 * @param {boolean} includeStack - If we should include the stack trace.
 * @returns {Function} - The default formatter function.
 * @private
 */
// eslint-disable-next-line no-unused-vars
const defaultFormatter = (includeStack) => (err, req, res, next) => {
  res.statusCode = err.status;

  const accept = req.headers.accept || '';

  const showStack = includeStack && (err.showStack !== undefined && err.showStack);
  if (accept.includes('json')) {
    res.setHeader('Content-Type', 'application/json');
    const json = { error: err.toJSON() };
    if (showStack) {
      json.error.stack = err.stack;
    }
    res.end(JSON.stringify(json));
  } else {
    res.writeHead(res.statusCode, { 'Content-Type': 'text/plain' });
    // noinspection JSCheckFunctionSignatures
    res.end(err.toString(false) + (showStack ? `\n${err.stack}` : ''));
  }
};

exports.errorHandler = errorHandler;
