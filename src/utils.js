const capitalizeEveryWord = (str) => str.replace(/\b[a-z]/g, (char) => char.toUpperCase());
const removeWhitespace = (str) => str.replace(/\s/g, '');
const removeNonWordCharacters = (str) => str.replace(/[^ _0-9a-z]/gi, '');

/**
 * Transform the given string to a JavaScript identifier, according to the following rules:
 * Remove all non-word characters
 * Title case each word
 * Remove whitespace
 *
 * @param {string} str - The string to transform
 * @returns {string} - The transformed string
 * @private
 */
const toJSIdentifier = (str) => {
  let retval = removeNonWordCharacters(str);
  retval = capitalizeEveryWord(retval);
  retval = removeWhitespace(retval);
  return retval;
};

/**
 * Returns the argument as an array. If the argument is not an array, it is wrapped in an array.
 *
 * @param {object|Array} val - The object to wrap in an array, if it is not already an array.
 * @returns {Array} - The array
 * @private
 */
const castArray = (val) => (Array.isArray(val) ? val : [val]);

exports.toJSIdentifier = toJSIdentifier;
exports.toArray = castArray;
