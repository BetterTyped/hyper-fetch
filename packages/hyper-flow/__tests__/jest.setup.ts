// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

const electronApiMock = {
  store: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
  getAppVersion: jest.fn().mockReturnValue("1.0.0"),
  server: {
    status: jest.fn(),
    restart: jest.fn(),
    onStatusChange: jest.fn().mockImplementation((callback) => {
      callback(true);
      return () => {};
    }),
  },
};

Object.defineProperty(window, "electron", {
  value: electronApiMock,
  writable: false,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
