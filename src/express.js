const { errors } = require('./errors');

// noinspection JSUnusedLocalSymbols
/**
 * This is  custom error handler for express.  It just gives us a little more control over the output.
 *
 * @param {object} options - A dictionary of options used to control how error object are formatted for the Express response
 * @returns {Function} - The custom error handler middleware.
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
// eslint-disable-next-line no-unused-vars
const makeErrorHandler = (options) => (err, req, res, next) => {
  const localOptions = { ...options };
  const localError = !err.isBCError ? new errors.HTTP500Error(err, 500) : err;
  const status = localError.status || localError.statusCode || localError.code || 500;

  res.statusCode = status < 400 ? 500 : status;

  const accept = req.headers.accept.toLowerCase() || '';

  const showStack = !!(localOptions.includeStack && (localError.showStack !== undefined && localError.showStack));
  if (accept.includes('json') || accept.includes('*/*')) {
    res.setHeader('Content-Type', 'application/json');
    const json = { error: localError.toJSON(showStack) };
    res.end(JSON.stringify(json));
  } else {
    res.writeHead(res.statusCode, { 'Content-Type': 'text/plain' });
    // noinspection JSCheckFunctionSignatures
    res.end(localError.toString(false) + (showStack ? `\n${localError.stack}` : ''));
  }
  if (localError.fatal && !localOptions.ignoreFatal) {
    process.exit(localError.code);
  }
};

process.on('uncaughtException', (err, origin) => {
  console.error(`Caught exception: ${err.toString()}\nException origin: ${origin}`);
  process.exit(err.code);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(reason.code || 1);
});

exports.makeErrorHandler = makeErrorHandler;
