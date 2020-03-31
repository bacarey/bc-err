const HTTPError = require('../src/HTTPError');

const testErrors = [
  new Error('Message #0 passed to constructor'),
  new Error('Message #1 passed to constructor'),
  new Error('Message #2 passed to constructor'),
  new Error('Message #3 passed to constructor'),
  new Error('Message #4 passed to constructor'),
];

const argSets = [
  ['Message #0', 100, { defaultMessage: 'Default Message #0' }, testErrors[0]],
  ['Message #1', 123, testErrors[1]],
  [234, testErrors[2]],
  ['Message #3', testErrors[3]],
  [testErrors[4]],
];

describe('HTTPError.parseArgs()', () => {
  test('full args', () => {
    expect(HTTPError.parseArgs(...argSets[0])).toStrictEqual({
      error: testErrors[0],
      status: 100,
      message: 'Message #0',
      props: {
        defaultMessage: 'Default Message #0',
      },
    });
  });
  test('partial args - msg + err + code', () => {
    expect(HTTPError.parseArgs(...argSets[1])).toStrictEqual({
      error: testErrors[1],
      status: 123,
      message: 'Message #1',
      props: {},
    });
  });
  test('partial args - code + err', () => {
    expect(HTTPError.parseArgs(...argSets[2])).toStrictEqual({
      error: testErrors[2],
      status: 234,
      props: {},
    });
  });
  test('partial args - msg + err', () => {
    expect(HTTPError.parseArgs(...argSets[3])).toStrictEqual({
      error: testErrors[3],
      message: 'Message #3',
      props: {},
    });
  });
  test('partial args - err only', () => {
    expect(HTTPError.parseArgs(...argSets[4])).toStrictEqual({
      error: testErrors[4],
      props: {},
    });
  });
  test('partial args - msg only', () => {
    expect(HTTPError.parseArgs('Message only')).toStrictEqual({
      message: 'Message only',
      props: {},
    });
  });
  test('no args', () => {
    expect(HTTPError.parseArgs()).toStrictEqual({
      props: {},
    });
  });
  test('bad arg', () => {
    expect(HTTPError.parseArgs(new Date())).toStrictEqual({
      props: {},
    });
  });
});

describe('HTTPError constructor', () => {
  test('able to construct HTTPError object with only a message', () => {
    const newError = new HTTPError('This is test message #1.');
    // expect(newError.isBCError).toBeTruthy();
    expect(newError.code).toBe(500);
    expect(newError.explanation).toBe('The error is non-specific.');
    expect(newError.message).toBe('This is test message #1.');
    expect(newError.parentClass).toBe('Error');
  });
  test('able to construct HTTPError object with a message and code', () => {
    const newError = new HTTPError('This is test message #2.', 404);
    // expect(newError.isBCError).toBeTruthy();
    expect(newError.code).toBe(404);
    expect(newError.explanation).toBe('The error is non-specific.');
    expect(newError.message).toBe('This is test message #2.');
    expect(newError.parentClass).toBe('Error');
  });
  test('able to construct HTTPError object with a message and error', () => {
    try {
      const foo = {};
      console.log(foo.nonexistent.nonexistent1);
    } catch (originalError) {
      const newError = new HTTPError('This is test message #3.', originalError);
      // expect(newError.isBCError).toBeTruthy();
      expect(newError.code).toBe(500);
      expect(newError.explanation).toBe('The error is non-specific.');
      expect(newError.message).toBe('This is test message #3.');
      expect(newError.originalError.message).toBe('Cannot read property \'nonexistent1\' of undefined');
      expect(newError.parentClass).toBe('Error');
    }
  });
  test('able to construct HTTPError object with a message, error, and code', () => {
    try {
      const foo = {};
      console.log(foo.nonexistent.nonexistent2);
    } catch (originalError) {
      const newError = new HTTPError('This is test message #4.', originalError, 400);
      // expect(newError.isBCError).toBeTruthy();
      expect(newError.code).toBe(400);
      expect(newError.explanation).toBe('The error is non-specific.');
      expect(newError.message).toBe('This is test message #4.');
      expect(newError.originalError.message).toBe('Cannot read property \'nonexistent2\' of undefined');
      expect(newError.parentClass).toBe('Error');
    }
  });
  test('able to construct HTTPError object with a message, error, code, and props', () => {
    try {
      const foo = {};
      console.log(foo.nonexistent.nonexistent3);
    } catch (originalError) {
      const newError = new HTTPError('This is test message #5.', originalError, 444, {
        fruit: 'banana',
        defaultExplanation: 'Bananas are not fruits.',
      });
      // expect(newError.isBCError).toBeTruthy();
      expect(newError.code).toBe(444);
      expect(newError.fruit).toBe('banana');
      expect(newError.explanation).toBe('Bananas are not fruits.');
      expect(newError.message).toBe('This is test message #5.');
      expect(newError.originalError.message).toBe('Cannot read property \'nonexistent3\' of undefined');
      expect(newError.parentClass).toBe('Error');
    }
  });
  test('toString() does its job with no parameters', () => {
    const newError = new HTTPError('This is test message #6.', 400);
    const errorString = newError.toString(false);
    const errorObject = {};
    errorString.split(/[\r\n]+/).forEach((line) => {
      const [key, val] = line.split(/:\s*/);
      errorObject[key] = val;
    });
    expect(errorObject.HTTPError).toBe('This is test message #6.');
    expect(errorObject.Code).toBe('400');
    expect(errorObject['Parent Class']).toBe('Error');
  });
  test('toString() does its job with no stack', () => {
    const newError = new HTTPError('This is test message #7.', 404);
    const errorString = newError.toString(false);
    const errorObject = {};
    errorString.split(/[\r\n]+/).forEach((line) => {
      const [key, val] = line.split(/:\s*/);
      errorObject[key] = val;
    });
    expect(errorObject.HTTPError).toBe('This is test message #7.');
    expect(errorObject.Code).toBe('404');
    expect(errorObject['Parent Class']).toBe('Error');
  });
  test('toJSON() does its job', () => {
    const newError = new HTTPError('This is test message #8.', 400);
    expect(newError.toJSON(false, { blacklist: ['parentClass'] })).toStrictEqual({
      code: 400,
      message: 'This is test message #8.',
      name: 'HTTPError',
    });
  });
});
