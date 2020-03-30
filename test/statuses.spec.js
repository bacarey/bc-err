const { STATUS_CODES } = require('http');
const statuses = require('../src/statuses');

describe('statuses', () => {
  test('we have the codes we think we should', () => {
    expect(statuses.codes.length).toBe(Object.keys(STATUS_CODES).length);
  });

  test('isInformational() returns correct positive', () => {
    expect(statuses.isInformational(101)).toBeTruthy();
  });
  test('isInformational() returns correct negative', () => {
    expect(statuses.isInformational(321)).toBeFalsy();
  });

  test('isSuccessful() returns correct positive', () => {
    expect(statuses.isSuccessful(222)).toBeTruthy();
  });
  test('isSuccessful() returns correct negative', () => {
    expect(statuses.isSuccessful(111)).toBeFalsy();
  });

  test('isRedirect() returns correct positive', () => {
    expect(statuses.isRedirect(303)).toBeTruthy();
  });
  test('isRedirect() returns correct negative', () => {
    expect(statuses.isRedirect(404)).toBeFalsy();
  });

  test('isClient() returns correct positive', () => {
    expect(statuses.isClient(404)).toBeTruthy();
  });
  test('isClient() returns correct negative', () => {
    expect(statuses.isClient(500)).toBeFalsy();
  });

  test('isServer() returns correct positive', () => {
    expect(statuses.isServer(502)).toBeTruthy();
  });
  test('isServer() returns correct negative', () => {
    expect(statuses.isServer(200)).toBeFalsy();
  });

  test('isEmpty() returns correct positive', () => {
    expect(statuses.isEmpty(204)).toBeTruthy();
  });
  test('isEmpty() returns correct negative', () => {
    expect(statuses.isEmpty(200)).toBeFalsy();
  });

  test('shouldRetry() returns correct positive', () => {
    expect(statuses.shouldRetry(404)).toBeTruthy();
  });
  test('shouldRetry() returns correct negative', () => {
    expect(statuses.shouldRetry(500)).toBeFalsy();
  });
});
