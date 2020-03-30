const { STATUS_CODES } = require('http');
/**
 * The base Error class from which all other Error classes are extended.
 * This ensures consistent construction, properties, and methods.
 */
class HTTPError extends Error {
  constructor(...args) {
    let err;
    let props = {};
    let message = '';
    let status = null;

    args.forEach((arg) => {
      if (arg instanceof Error) {
        err = arg;
        status = err.status || err.statusCode || status;
      } else {
        if (typeof arg === 'string') {
          message = arg;
        }
        if (typeof arg === 'number') {
          status = arg;
        }
        if (typeof arg === 'object') {
          props = arg;
        }
      }
    });

    // noinspection JSCheckFunctionSignatures
    super(message);
    this.status = status || this.defaultStatus || 500;
    this.message = message || this.defaultMessage || STATUS_CODES[this.status] || '';
    this.expose = this.status < 500;
    this.code = this.status;
    this.statusCode = this.status;
    this.parent = this.parent || 'Error';
    if (err) {
      this.originalError = err;
      this.stack = err.stack.replace(/^Error:/, `${this.constructor.name}:`);
    }
    this.showStack = (typeof this.showStack === 'boolean') ? this.showStack : true; // by default

    Object.entries(props).forEach(([key, prop]) => {
      if (key !== 'status' && key !== 'statusCode') {
        this[key] = prop;
      }
    });
    this.defaultExplanation = this.defaultExplanation || 'The error is non-specific.';
    this.defaultSuggestion = this.defaultSuggestion || 'You might retry the operation.';

    this.explanation = this.explanation || this.defaultExplanation;
    this.suggestion = this.suggestion || this.defaultSuggestion || '';

    this.isBCError = true;
  }

  toString(includeStack = true, fieldLists = {}) {
    let retval = `${this.constructor.name}: ${this.message}\nCode: ${this.statusCode}`;
    if (this.explanation && !(fieldLists.blacklist && fieldLists.blacklist.includes('explanation'))) {
      retval = `${retval}\nExplanation: ${this.explanation}`;
    }
    if (this.suggestion && !(fieldLists.blacklist && fieldLists.blacklist.includes('suggestion'))) {
      retval = `${retval}\nSuggestion: ${this.suggestion}`;
    }
    if (this.parent && !(fieldLists.blacklist && fieldLists.blacklist.includes('parent'))) {
      retval = `${retval}\nParent: ${this.parent}`;
    }

    const propBlacklist = fieldLists.blacklist || ['name', 'message', 'statusCode', 'status', 'code', 'suggestion', 'explanation', 'stack', 'expose', 'parent', 'defaultExplanation', 'defaultSuggestion', 'defaultMessage', 'showStack', 'isBCError'];
    const propWhitelist = fieldLists.whitelist || [];
    const absoluteBlacklist = ['explanation', 'suggestion', 'parent'];

    if (propWhitelist.length) {
      Object.keys(this).filter((key) => propWhitelist.includes(key) && !absoluteBlacklist.includes(key)).forEach((key) => {
        retval = `${retval}\n${key}: ${this[key]}`;
      }, this);
    } else {
      Object.keys(this).filter((key) => !propBlacklist.includes(key) && !absoluteBlacklist.includes(key)).forEach((key) => {
        retval = `${retval}\n${key}: ${this[key]}`;
      }, this);
    }

    if (includeStack && this.showStack) {
      retval = `${retval}\n${this.stack}`;
    }
    return retval;
  }

  toJSON() {
    const attrs = {
      stack: ['stack'],
      message: ['message'],
      name: ['constructor.name'],
      code: ['code'],
    };
    const formatted = {};

    Object.entries(attrs).forEach(([dest, attr]) => {
      attr.forEach((src) => {
        let val = this;
        const segs = src.split('.');

        segs.forEach((seg) => {
          if (seg === 'stack') {
            val = null;
          } else {
            val = seg in val ? val[seg] : null;
          }
        });

        if (val) {
          formatted[dest] = val;
        }
      });
    });
    return formatted;
  }
}

module.exports = HTTPError;
