const { createErrorClass } = require('../index');

describe('createErrorClass()', () => {
  test('creates an Error class', () => {
    // noinspection LocalVariableNamingConventionJS
    const NewClass = createErrorClass(418, 'SomeError');
    const newError = new NewClass('This is a test message.');
    expect(newError.isBCError).toBeTruthy();
    expect(newError.code).toBe(418);
    expect(newError.explanation).toBe('The server refuses the attempt to brew coffee with a teapot.');
    expect(newError.message).toBe('This is a test message.');
    expect(newError.parent).toBe('HTTPError');
    expect(newError.constructor.name).toBe('SomeError');
  });

  test('fails with missing params', () => {
    expect(() => {
      const newClass1 = createErrorClass();
      const newClass2 = createErrorClass(1);
      const newClass3 = createErrorClass(1, 2);
    }).toThrow(TypeError);
  });

  test('fails with parameter type mismatch', () => {
    expect(() => {
      const newClass1 = createErrorClass();
    }).toThrow(TypeError);
  });
});
