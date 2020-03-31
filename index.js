const express = require('./src/express');
const {
  errors,
  createErrorClass,
  throwByClassName,
  makeAndExportAllHTTPErrorClasses,
  makeHTTPErrorClassByCode,
  makeHTTPErrorClassByName,
} = require('./src/errors');

module.exports = {
  errorHandler: express.errorHandler,
  errors,
  createErrorClass,
  throwByClassName,
  makeAndExportAllHTTPErrorClasses,
  makeHTTPErrorClassByCode,
  makeHTTPErrorClassByName,
};
