// eslint-disable-next-line max-classes-per-file
const { toJSIdentifier } = require('./src/utils');
const statuses = require('./src/statuses');
const HTTPError = require('./src/HTTPError');
const explanations = require('./src/explanations');

exports.express = require('./src/express');

/**
 * Gets the error class for a given status code.
 *
 * @param {number} status - The status code
 * @returns {number} The error class (i.e. 300, 400, 500, etc.)
 * @private
 */
const getStatusType = (status) => Math.floor(status / 100) * 100;

/**
 * Creates a new class, extended from a base class
 *
 * @param {number} code - The error code
 * @param {string} name - The name of the new class. If it does not end with "Error", that will be appended to the class name.
 * @param {object<string, *>} options - A KVP object containing additional options for this class.
 * @returns {object} The definition of the new class
 * @example
 * const { createErrorClass } = require('bc-err');
 *
 * const CausalLoopError = createErrorClass(642, 'CausalLoopError', {
 *   explanation: 'A causal loop was detected, creating a temporal paradox. A future event is the cause of a past event, which in turn is the cause of the future event.',
 *   suggestion: 'Since both events exist in spacetime, their origin cannot be determined. Try turning off your computer and turning it bock on.',
 *   });
 * const timeParadoxError = new CausalLoopError('Causal loop detected.');
 *
 * console.log(timeParadoxError.toString());
 *
 * // Outputs the following:
 * // CausalLoopError: Causal loop detected.
 * // Code: 642
 * // Explanation: A causal loop was detected, creating a temporal paradox. A future event is the cause of a past event, which in turn is the cause of the future event.
 * // Suggestion: Since both events exist in spacetime, their origin cannot be determined. Try turning off your computer and turning it bock on.
 * // Parent: HTTPError
 * // Error: Causal loop detected.
 * //   <stacktrace>
 */
const createErrorClass = (code, name = '', options = {}) => {
  let newClass;
  const className = makeValidErrorClassName(name) || makeValidErrorClassName(statuses[code]);

  const classOptions = { ...options };
  classOptions.extendedClassName = classOptions.extendedClassName || 'HTTPError';

  const explanation = explanations[code.toString()];
  if (explanation) {
    classOptions.defaultExplanation = classOptions.defaultExplanation || explanation;
  }
  if (statuses.shouldRetry(code)) {
    classOptions.defaultSuggestions = classOptions.defaultSuggestions || 'You might retry the request.';
  }

  if (!code) {
    throw new TypeError('Missing a required parameter: code');
  }

  if (typeof name !== 'string') {
    throw new TypeError(`The name parameter must be a string and not a ${typeof name}`);
  }

  if (typeof code !== 'number') {
    throw new TypeError(`The name parameter must be a number and not a ${typeof name}`);
  }

  if (!exports[className]) {
    newClass = class extends HTTPError {
      constructor(message, ...opts) {
        const msg = message !== null ? message : statuses[code];
        super(msg, ...opts);
      }
    };

    nameClass(newClass, className);

    newClass.prototype.parent = classOptions.extendedClassName || 'HTTPError';
    newClass.prototype.defaultStatus = code;
    newClass.prototype.statusCode = code;
    newClass.prototype.explanation = classOptions.explanation || '';
    newClass.prototype.suggestion = classOptions.suggestion || '';
    newClass.prototype.statusType = getStatusType(code);

    Object.entries(classOptions).filter(([optKey]) => !(['code', 'name', 'explanation', 'suggestion', 'parent', 'extendedClassName'].includes(optKey))).forEach(([key, value]) => {
      newClass.prototype[key] = value;
    });

    exportErrorClass(newClass, className, code);
  } else {
    newClass = exports[className];
  }

  return newClass;
};

/**
 * Takes a string and outputs a string that conforms to class naming conventions and is a valid JS identifier.
 *
 * @param {string} name - The name we are working with
 * @returns {string} A string which could be used as a valid class name
 * @private
 */
const makeValidErrorClassName = (name) => {
  let retval = '';
  if (name && typeof name === 'string') {
    const identifer = toJSIdentifier(name);
    retval = identifer.toLowerCase().endsWith('error') ? identifer : `${identifer}Error`;
  }
  return retval;
};

/**
 * Renames a class. This is handy, since we are generating class definitions dynamicallly.
 *
 * @param {object} classDefinition - The class definition we are renaming
 * @param {string} name - The new name
 * @private
 */
const nameClass = (classDefinition, name) => {
  const descriptor = Object.getOwnPropertyDescriptor(classDefinition, 'name');

  if (descriptor && descriptor.configurable) {
    descriptor.value = name;
    Object.defineProperty(classDefinition, 'name', descriptor);
  }
};

/**
 * Adds a class to exports by name and code, so it can be referenced either way by any code that imports this file.
 *
 * @param {object} errorClass - The class definition
 * @param {string} className - The name of the class
 * @param {number} code - The default error status code
 * @private
 */
const exportErrorClass = (errorClass, className, code) => {
  if (errorClass) {
    if (!exports[`HTTP${code}Error`]) {
      exports[`HTTP${code}Error`] = errorClass;
    }
    if (!exports[className]) {
      exports[className] = errorClass;
    }
  }
};

/**
 * Populate the exports object with definitions for every error class.
 */
const makeAndExportAllHTTPErrorClasses = () => {
  statuses.codes.forEach((code) => {
    const className = toJSIdentifier(statuses[code]);

    const options = {
      extendedClassName: 'HTTPError',
    };
    const explanation = explanations[code.toString()];
    if (explanation) {
      options.defaultExplanation = explanation;
    }
    if (statuses.shouldRetry(code)) {
      options.defaultSuggestions = 'You might retry the request.';
    }

    const errorClass = createErrorClass(code, className, options);

    exportErrorClass(errorClass, className, code);
  });
};

exports.makeAndExportAllHTTPErrorClasses = makeAndExportAllHTTPErrorClasses;
exports.createErrorClass = createErrorClass;
