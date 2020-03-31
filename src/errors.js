// eslint-disable-next-line max-classes-per-file
const { toJSIdentifier } = require('./utils');
const statuses = require('./statuses');
const HTTPError = require('./HTTPError');
const explanations = require('./explanations');

const localErrors = {};

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
  if (typeof code !== 'number') {
    throw new TypeError('Missing a required parameter or parameter is not a number: code');
  }
  if (typeof name !== 'string') {
    throw new TypeError(`The name parameter must be a string and not a ${typeof name}`);
  }
  if (typeof options !== 'object') {
    throw new TypeError(`The options parameter must be an object and not a ${typeof name}`);
  }

  const classOptions = { ...options };

  let className;
  if (classOptions.noIDParse) {
    className = name;
  } else {
    className = makeValidErrorClassName(name) || makeValidErrorClassName(statuses[code]) || makeValidErrorClassName(toJSIdentifier(statuses[code]));
  }

  classOptions.extendedClassName = classOptions.extendedClassName || 'HTTPError';

  const explanation = explanations[code.toString()];
  if (explanation && !options.defaultExplanation) {
    classOptions.defaultExplanation = explanation;
  }
  if (statuses.shouldRetry(code) && !options.defaultSuggestion) {
    classOptions.defaultSuggestion = options.suggestion || 'You might retry the request.';
  }

  const newClass = class extends HTTPError {
    constructor(...args) {
      const message = args.find((arg) => typeof arg === 'string');

      if (!message) {
        args.push(statuses[code]);
      }
      super(...args);
    }
  };

  nameClass(newClass, className);

  // newClass.prototype.defaultStatus = code;
  newClass.prototype.defaultMessage = statuses[code];
  newClass.prototype.code = code;
  newClass.prototype.status = code;
  newClass.prototype.statusCode = code;
  newClass.prototype.explanation = classOptions.explanation || '';
  newClass.prototype.suggestion = classOptions.suggestion || '';
  newClass.prototype.statusType = statuses.getStatusType(code);
  newClass.prototype.parent = 'HTTPError';

  Object.entries(classOptions).filter(([optKey]) => !(['code', 'name', 'explanation', 'suggestion', 'parent', 'extendedClassName', 'noAutoCache'].includes(optKey))).forEach(([key, value]) => {
    newClass.prototype[key] = value;
  });

  if (!options.noAutoCache) {
    if (classOptions.exportNumericClass) {
      proxyErrors[`HTTP${code}Error`] = newClass;
    }
    proxyErrors[className] = newClass;
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
 * Populate the proxyErrors object with definitions for every error class.
 */
const makeAndExportAllHTTPErrorClasses = () => {
  statuses.codes.forEach((code) => {
    const errorClassDef = makeHTTPErrorClassByCode(code);
    const className = `${toJSIdentifier(statuses[code])}Error`;
    proxyErrors[`HTTP${code}Error`] = errorClassDef;
    proxyErrors[className] = errorClassDef;
  });
};

const makeHTTPErrorClassByCode = (code, options = {}) => {
  const className = makeValidErrorClassName(toJSIdentifier(statuses[code]));
  const classOptions = { ...options };
  classOptions.noIDParse = true;
  return createErrorClass(Number(code), className, options);
};

const makeHTTPErrorClassByName = (shortName, options = {}) => {
  const foundCode = Object.keys(statuses).filter((key) => Number(key).toString() === key).find((code) => {
    const candidate = toJSIdentifier(statuses[code]);
    return candidate.toLowerCase() === shortName.toLowerCase();
  });
  if (foundCode) {
    makeHTTPErrorClassByCode(Number(foundCode), options);
  } else {
    const validName = shortName.toLowerCase().endsWith('error') ? shortName : `${shortName}Error`;

    createErrorClass(500, validName, { noIDParse: true });
  }
};

const throwByClassName = (errorClassName, ...args) => {
  // noinspection LocalVariableNamingConventionJS
  const ErrorClass = proxyErrors[errorClassName];
  throw new ErrorClass(...args);
};

const proxyErrors = new Proxy(localErrors, {
  get(target, name) {
    let errorName;
    let code;
    if (!target[name]) {
      let errorClassDef;
      const matchWithCode = name.match(/^HTTP(\d{3}?)Error$/m);
      if (matchWithCode && matchWithCode.length > 1) {
        [, code] = matchWithCode;
      } else {
        const matchWithName = name.match(/^([a-zA-Z]+?)Error$/m);
        if (matchWithName && matchWithName.length > 1) {
          [, errorName] = matchWithName;
        }
      }
      if (code) {
        errorClassDef = makeHTTPErrorClassByCode(code);
        proxyErrors[`HTTP${code}Error`] = errorClassDef;
      } else {
        const foundCode = Object.keys(statuses).filter((key) => Number(key).toString() === key).find((errCode) => {
          const candidate = toJSIdentifier(statuses[errCode]);
          return candidate.toLowerCase() === errorName.toLowerCase();
        });
        if (foundCode) {
          errorClassDef = makeHTTPErrorClassByCode(foundCode);
          proxyErrors[`HTTP${code}Error`] = errorClassDef;
        } else {
          errorClassDef = makeHTTPErrorClassByName(name);
          proxyErrors[name] = errorClassDef;
        }
      }
      // exportErrorClass(errorClassDef, name, code);
      // proxyErrors[`HTTP${code}Error`] = errorClass;
      // proxyErrors[className] = errorClass;
    }
    return Reflect.get(target, name);
  },
});

module.exports = proxyErrors;
module.exports = {
  errors: proxyErrors,
  makeAndExportAllHTTPErrorClasses,
  createErrorClass,
  throwByClassName,
};
