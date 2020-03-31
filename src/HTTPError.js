const { STATUS_CODES } = require('http');
const { splitCamelCase } = require('./utils');
const statuses = require('./statuses');

/**
 * The base Error class from which all other Error classes are extended.
 * This ensures consistent construction, properties, and methods.
 */
class HTTPError extends Error {
  constructor(...args) {
    const params = HTTPError.parseArgs(...args);

    // noinspection JSCheckFunctionSignatures
    super(params.message);

    this.status = params.status || this.status || 500;
    this.code = this.status;
    if (params.error) {
      this.originalError = params.error;
      this.stack = params.error.stack.replace(/^Error:/, `${this.constructor.name}:`);
    }
    this.defaultStatus = this.status;
    this.statusCode = this.status;

    this.parseProps(params.props);

    this.defaultExplanation = this.defaultExplanation || 'The error is non-specific.';
    this.explanation = this.explanation || this.defaultExplanation;

    this.defaultSuggestion = this.defaultSuggestion || statuses.shouldRetry(this.status) ? 'You might retry the operation.' : 'No specific suggestions.';
    this.suggestion = this.suggestion || this.defaultSuggestion || '';

    this.defaultMessage = this.defaultMessage || 'An error has occurred.';
    this.message = this.message || STATUS_CODES[this.status] || this.defaultMessage;

    this.parentClass = this.parentClass || 'Error';
    this.showStack = (typeof this.showStack === 'boolean') ? this.showStack : true; // by default

    this.isBCError = true;

    // const staticPropertyNames = ['parentClass', 'defaultMessage', 'defaultSuggestion', 'defaultExplanation', 'defaultStatus', 'error', 'isBCError'];
    // staticPropertyNames.forEach((prop) => {
    //   Object.defineProperty(this, prop, {
    //     writable: false,
    //   });
    // });
  }

  /**
   * Used by the constructor to parse and validate constructor arguments
   *
   * @param {Array} args - An array of arguments
   * @returns {{}} - A KVP of values to be used by the constructor
   */
  static parseArgs(...args) {
    const error = args.find((arg) => arg instanceof Error);
    const status = args.find((arg) => typeof arg === 'number');
    const message = args.find((arg) => typeof arg === 'string');
    const props = args.find((arg) => Object.getPrototypeOf(arg).constructor.name === 'Object') || {};

    const params = {
      props,
    };
    if (status) {
      params.status = status;
    }
    if (error) {
      params.error = error;
      const restatus = params.status || params.error.status || params.error.statusCode;
      if (restatus) {
        params.status = restatus;
      }
    }
    if (message) {
      params.message = message;
    }

    return params;
  }

  /**
   * Used by toString() and toJSON() to determine which fields to show
   *
   * @param {object} fieldLists - A KVP of arrays of property names
   * @param {Array.<string>=} fieldLists.blacklist - An array of property names to omit
   * @param {Array.<string>=} fieldLists.whitelist - An array of property names to include
   * @returns {Array.<string>} - An array of property names
   */
  getFieldList(fieldLists = {}) {
    const propBlacklist = ['name', 'message', 'statusCode', 'status', 'code', 'stack', 'defaultExplanation', 'defaultSuggestion', 'defaultMessage', 'defaultStatus', 'showStack', 'isBCError'];
    const propWhitelist = fieldLists.whitelist || [];
    const absoluteBlacklist = ['explanation', 'suggestion'];
    if (Array.isArray(fieldLists.blacklist)) {
      propBlacklist.push(...fieldLists.blacklist);
    }
    const fields = [];

    if (propWhitelist.length) {
      Object.keys(this).filter((key) => propWhitelist.includes(key) && !absoluteBlacklist.includes(key)).forEach((key) => {
        fields.push(key);
      }, this);
    } else {
      Object.keys(this).filter((key) => (!absoluteBlacklist.includes(key) && (propWhitelist.includes(key) || !propBlacklist.includes(key)))).forEach((key) => {
        fields.push(key);
      }, this);
    }
    return fields;
  }

  /**
   * Overrides toString() to improve output formatting.
   *
   * @param {boolean} includeStack - Should we output the stack?
   * @param {{}} fieldLists - A KVP of arrays of property names o blacklist or whitelist.
   * @returns {string} - The formatted output string
   */
  toString(includeStack = true, fieldLists = {}) {
    const fields = this.getFieldList(fieldLists);
    let retval = `${this.constructor.name}: ${this.message}\nCode: ${this.statusCode}`;
    if (this.explanation && fields.includes('explanation')) {
      retval = `${retval}\nExplanation: ${this.explanation}`;
    }
    if (this.suggestion && fields.includes('suggestion')) {
      retval = `${retval}\nSuggestion: ${this.suggestion}`;
    }
    // if (this.parentClass && fields.includes('parentClass')) {
    //   retval = `${retval}\nParent Class: ${this.parentClass}`;
    // }

    fields.forEach((field) => {
      retval = `${retval}\n${splitCamelCase(field)}: ${this[field]}`;
    });

    // const propBlacklist = fieldLists.blacklist || ['name', 'message', 'statusCode', 'status', 'code', 'suggestion', 'explanation', 'stack', 'parentClass', 'defaultExplanation', 'defaultSuggestion', 'defaultMessage', 'showStack', 'isBCError'];
    // const propWhitelist = fieldLists.whitelist || [];
    // const absoluteBlacklist = ['explanation', 'suggestion'];
    //
    // if (propWhitelist.length) {
    //   Object.keys(this).filter((key) => propWhitelist.includes(key) && !absoluteBlacklist.includes(key)).forEach((key) => {
    //     retval = `${retval}\n${key}: ${this[key]}`;
    //   }, this);
    // } else {
    //   Object.keys(this).filter((key) => !propBlacklist.includes(key) && !absoluteBlacklist.includes(key)).forEach((key) => {
    //     retval = `${retval}\n${key}: ${this[key]}`;
    //   }, this);
    // }

    if (includeStack && this.showStack) {
      retval = `${retval}\n${this.stack}`;
    }
    return retval;
  }

  /**
   * Overrides toJSON() to improve output formatting.
   *
   * @param {boolean} includeStack - Should we output the stack?
   * @param {{}} fieldLists - A KVP of arrays of property names o blacklist or whitelist.
   * @returns {{}} - The parsed JSON output
   */
  toJSON(includeStack = true, fieldLists = {}) {
    const formatted = {
      name: this.constructor.name,
      message: this.message,
      code: this.statusCode,
      // stack: this.stack,
    };
    const fields = this.getFieldList(fieldLists);

    if (this.explanation && fields.includes('explanation')) {
      formatted.explanation = this.explanation;
    }
    if (this.suggestion && fields.includes('suggestion')) {
      formatted.suggestion = this.suggestion;
    }
    if (this.parentClass && fields.includes('parentClass')) {
      formatted.parentClass = this.parentClass;
    }

    fields.forEach((field) => {
      formatted[field] = this[field];
    });
    if (includeStack) {
      formatted.stack = this.stack;
    }
    return formatted;
  }

  parseProps(props) {
    Object.entries(props).forEach(([key, prop]) => {
      const dontSet = ['status', 'code', 'statusCode', 'message', 'originalError', 'stack'];
      if (!dontSet.includes(key)) {
        this[key] = prop;
      }
    });
  }
}

module.exports = HTTPError;
