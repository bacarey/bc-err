const express = require('./express');
const {
  errors,
  createErrorClass,
  throwByClassName,
  makeAndExportAllHTTPErrorClasses,
  makeHTTPErrorClassByCode,
  makeHTTPErrorClassByName,
} = require('./errors');

module.exports = {
  makeErrorHandler: express.makeErrorHandler,
  errors,
  createErrorClass,
  throwByClassName,
  makeAndExportAllHTTPErrorClasses,
  makeHTTPErrorClassByCode,
  makeHTTPErrorClassByName,
};
