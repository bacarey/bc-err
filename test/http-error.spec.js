const HTTPError = require('../src/HTTPError');

describe('HTTPError', () => {
  test('able to construct HTTPError object with only a message', () => {
    const newError = new HTTPError('This is test message #1.');
    // expect(newError.isBCError).toBeTruthy();
    expect(newError.code).toBe(500);
    expect(newError.explanation).toBe('The error is non-specific.');
    expect(newError.message).toBe('This is test message #1.');
    expect(newError.parent).toBe('Error');
  });
  test('able to construct HTTPError object with a message and code', () => {
    const newError = new HTTPError('This is test message #2.', 404);
    // expect(newError.isBCError).toBeTruthy();
    expect(newError.code).toBe(404);
    expect(newError.explanation).toBe('The error is non-specific.');
    expect(newError.message).toBe('This is test message #2.');
    expect(newError.parent).toBe('Error');
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
      expect(newError.parent).toBe('Error');
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
      expect(newError.parent).toBe('Error');
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
      expect(newError.parent).toBe('Error');
    }
  });
  test('toString() does its job with no paramaeters', () => {
    const newError = new HTTPError('This is test message #6.', 400);
    expect(newError.toString()).toMatch(/HTTPError: This is test message #6\.\s*Code: 400\s*Explanation: The error is non-specific\.\s*Parent: Error\s*Error: This is test message #6\.\s*at [\s\S]*/);
  });
  test('toString() does its job with no stack', () => {
    const newError = new HTTPError('This is test message #7.', 404);
    expect(newError.toString(false)).toMatch(/HTTPError: This is test message #7\.\s*Code: 404\s*Explanation: The error is non-specific\.\s*Parent: Error/);
  });
  test('toJSON() does its job', () => {
    const newError = new HTTPError('This is test message #8.', 400);
    expect(newError.toJSON()).toStrictEqual({
      code: 400,
      message: 'This is test message #8.',
      name: 'HTTPError',
    });
  });
});
