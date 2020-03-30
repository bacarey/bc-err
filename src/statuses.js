const http = require('http');

/**
 * Builds a robust bidirectional map of statuses
 *
 * @private
 */
const populateStatuses = () => {
  const httpStatusCodes = http.STATUS_CODES;

  Object.keys(httpStatusCodes).forEach((code) => {
    const message = httpStatusCodes[code];
    const statusCode = Number(code);

    statuses[statusCode] = message;
    statuses[message] = statusCode;
    statuses[message.toLowerCase()] = statusCode;
  });
};

const statuses = {
  codes: Object.keys(http.STATUS_CODES).map((code) => Number(code)),
  isInformational: (code) => Math.floor(Number(code) / 100) === 1,
  isSuccessful: (code) => Math.floor(Number(code) / 100) === 2,
  isRedirect: (code) => Math.floor(Number(code) / 100) === 3,
  isClient: (code) => Math.floor(Number(code) / 100) === 4,
  isServer: (code) => Math.floor(Number(code) / 100) === 5,
  isEmpty: (code) => [204, 205, 304].includes(Number(code)),
  shouldRetry: (code) => [404, 408, 412, 423, 424, 425, 428, 429, 502, 503, 504].includes(Number(code)),
};

populateStatuses();

module.exports = statuses;
