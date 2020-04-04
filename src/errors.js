// eslint-disable-next-line max-classes-per-file
const { toJSIdentifier } = require('./utils');
const statuses = require('./statuses');
const HTTPError = require('./HTTPError');
const explanations = require('./explanations');

/**
 * Creates a new class, extended from a base class
 *
 * @param {number} statusCode - The error code
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
const createErrorClass = (statusCode, name = '', options = {}) => {
  validateCreateErrorClassParams(statusCode, name, options);

  const classOptions = getClassOptions(statusCode, options);
  const className = getClassName(name, statusCode, classOptions);

  let newClass;
  if (className) {
    newClass = class extends HTTPError {
      constructor(...args) {
        const message = args.find((arg) => typeof arg === 'string');

        if (!message) {
          args.push(statuses[statusCode]);
        }
        super(...args);
      }
    };
  }
  if (newClass) {
    nameClass(newClass, className);
    newClass.prototype.defaultMessage = statuses[statusCode];
    newClass.prototype.code = statusCode;
    newClass.prototype.status = statusCode;
    newClass.prototype.statusCode = statusCode;
    newClass.prototype.explanation = classOptions.explanation || '';
    newClass.prototype.suggestion = classOptions.suggestion || '';
    newClass.prototype.statusType = statuses.getStatusType(statusCode);
    newClass.prototype.parentClass = 'HTTPError';
    newClass.prototype.fatal = !!classOptions.fatal;

    Object.entries(classOptions).filter(([optKey]) => !(['code', 'name', 'explanation', 'suggestion', 'parentClass', 'extendedClassName', 'noAutoCache', 'noIDParse', 'fatal'].includes(optKey))).forEach(([key, value]) => {
      newClass.prototype[key] = value;
    });

    if (!options.noAutoCache) {
      if (classOptions.exportNumericClass) {
        proxyErrors[`HTTP${statusCode}Error`] = newClass;
      }
      proxyErrors[className] = newClass;
    }
  }

  return newClass;
};

/**
 * Validates the parameters sent to createErrorClass. Just broken out into its own function for improved readability.
 *
 * @param {number} statusCode - The error code or HTTP status code that will be the default for the new class.
 * @param {string} name - The class name to be used for the new error class.
 * @param {{}} options - A dictionary of additional options used to create the class
 * @private
 */
const validateCreateErrorClassParams = (statusCode, name, options) => {
  if (typeof statusCode !== 'number') {
    throw new TypeError('Missing a required parameter or parameter is not a number: statusCode');
  }
  if (typeof name !== 'string') {
    throw new TypeError(`The name parameter must be a string and not a ${typeof name}`);
  }
  if (typeof options !== 'object') {
    throw new TypeError(`The options parameter must be an object and not a ${typeof name}`);
  }
};

/**
 * If needed, getClassName() comes up with a standardized class name, if one is not provided. This is called by createErrorClass()
 * broken out for improved readability.
 *
 * @param {string} name - The name or partial name of the class to generate
 * @param {number} statusCode - The error code or HTTP status code that will be the default for the new class.
 * @param {{}} options - A dictionary of additional options used to create the class
 * @returns {string} The new class name with standardized structure
 * @private
 */
const getClassName = (name, statusCode, options) => {
  let className;
  try {
    if (options.noIDParse) {
      className = name;
    } else {
      className = makeValidErrorClassName(name) || makeValidErrorClassName(statuses[statusCode]) || makeValidErrorClassName(toJSIdentifier(statuses[statusCode]));
    }
  } catch (e) {
    console.error(`getClassName failed:\n${e.toString()}`);
    className = '';
  }
  return className;
};

/**
 * Called by createErrorClass(), this applies a few default values to the options passed.
 *
 * @param {number} statusCode - The error code or HTTP status code that will be the default for the new class.
 * @param {{}} options - A dictionary of additional options used to create the class
 * @returns {{}} The options, after applying a few defaults.
 * @private
 */
const getClassOptions = (statusCode, options) => {
  const classOptions = { ...options };
  const explanation = explanations[statusCode.toString()];

  try {
    classOptions.extendedClassName = classOptions.extendedClassName || 'HTTPError';

    if (explanation && !options.defaultExplanation) {
      classOptions.defaultExplanation = explanation;
    }
    if (statuses.shouldRetry(statusCode) && !options.defaultSuggestion) {
      classOptions.defaultSuggestion = options.suggestion || 'You might retry the request.';
    }
  } catch (e) {
    console.error(`getClassOptions failed:\n${e.toString()}`);
  }
  return classOptions;
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
 * Create class definitions for all HTTP status codes (as defined in Node http.STATUS_CODES)
 * and export them (via the Proxy). Each class can be referenced by its number or name.
 *
 * @example
 * const { errors } = require('bc-err');
 * errors.makeAndExportAllHTTPErrorClasses();
 *
 * error1 = new HTTP404Error('Thing one is unavailable.');
 * error2 = new NotFoundError('Thing two is unavailable.');
 *
 * // error1 and error2 are both 404 errors.  BC-err just gives you these two ways to reference the same thing.
 */
const makeAndExportAllHTTPErrorClasses = () => {
  statuses.codes.forEach((code) => {
    const errorClassDef = makeHTTPErrorClassByCode(code);
    const className = `${toJSIdentifier(statuses[code])}Error`;
    proxyErrors[`HTTP${code}Error`] = errorClassDef;
    proxyErrors[className] = errorClassDef;
  });
};

/**
 * Defines a new class extended from HTTPError class for the status code supplied.
 *
 * @param {number} code - The status/error code of this error type
 * @param {object.<string, *>} options - A KVP of additional options for this class
 * @returns {{}} The newly defined class
 * @example
 * const { errors } = require('bc-err');
 *
 * errors.makeHTTPErrorClassByCode(642, {defaultMessage: 'The answer to the ultimate question of life, the universe, and everything was calculated. Missing question.'});
 * throw new errors.HTTP642Error('Please restate the question.');
 */
const makeHTTPErrorClassByCode = (code, options = {}) => {
  const className = makeValidErrorClassName(toJSIdentifier(statuses[code]));
  const classOptions = { ...options };
  classOptions.noIDParse = true;
  return createErrorClass(Number(code), className, options);
};

/**
 * Defines a new class extended from HTTPError class for the class name supplied.
 *
 * @param {string} shortName - The name of the error that will be used to build the class name
 * @param {object.<string, *>} options - A KVP of additional options for this class
 * @returns {{}} The newly defined class
 * @example
 * const { errors } = require('bc-err');
 *
 * errors.makeHTTPErrorClassByName('Missing Question', {defaultMessage: 'The answer to the ultimate question of life, the universe, and everything was calculated. Missing question.'});
 * throw new errors.MissingQuestionError('Please restate the question.');
 */
const makeHTTPErrorClassByName = (shortName, options = {}) => {
  const safeName = toJSIdentifier(shortName);
  const foundCode = Object.keys(statuses).filter((key) => Number(key).toString() === key).find((code) => {
    const candidate = toJSIdentifier(statuses[code]);
    return candidate.toLowerCase() === safeName.toLowerCase();
  });
  let newClass;
  if (foundCode) {
    newClass = makeHTTPErrorClassByCode(Number(foundCode), options);
  } else {
    const validName = safeName.toLowerCase().endsWith('error') ? safeName : `${safeName}Error`;
    newClass = createErrorClass(500, validName, { noIDParse: true, ...options });
  }
  return newClass;
};

/**
 * A convenience method that instantiates the named error class with the passed arguments and throws that error.
 *
 * @param {string} errorClassName - The name of the error class we are instantiating to throw.
 * @param {...string|number|object|Error} args - The arguments to pass to the constructo of the error class we are instantiating.
 * @example
 * const { throwByClasName } = require('bc-err');
 * throwByClassName('TemporalParadoxErrror', 'A causal loop was detected.', 699)
 */
const throwByClassName = (errorClassName, ...args) => {
  // noinspection LocalVariableNamingConventionJS
  const ErrorClass = proxyErrors[errorClassName];
  throw new ErrorClass(...args);
};

/**
 * By exporting a proxy to localErrors, we are able to intercept references to properties (i.e. error classes)
 * that don't yet exist.  Then, we create them, if we can, so we don't have to do it again.
 */
const proxyErrors = new Proxy({}, {
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
      } else if (errorName) {
        const foundCode = Object.keys(statuses).filter((key) => Number(key).toString() === key).find((errCode) => {
          const candidate = toJSIdentifier(statuses[errCode]);
          return candidate.toLowerCase() === errorName.toLowerCase();
        });
        if (foundCode) {
          errorClassDef = makeHTTPErrorClassByCode(Number(foundCode));
          proxyErrors[`HTTP${code}Error`] = errorClassDef;
        } else {
          errorClassDef = makeHTTPErrorClassByName(name);
          proxyErrors[name] = errorClassDef;
        }
      }
    }

    if (target[name] === undefined) {
      throw new TypeError(`${name} is undefined. You may need to create it, first.`);
    }
    return Reflect.get(target, name);
  },
});

module.exports = proxyErrors;
module.exports = {
  errors: proxyErrors,
  makeAndExportAllHTTPErrorClasses,
  makeHTTPErrorClassByCode,
  makeHTTPErrorClassByName,
  createErrorClass,
  throwByClassName,
};
