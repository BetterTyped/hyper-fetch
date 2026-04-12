/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const electronApiMock = {
  store: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  getAppVersion: vi.fn().mockReturnValue("1.0.0"),
  server: {
    status: vi.fn(),
    restart: vi.fn(),
    onStatusChange: vi.fn().mockImplementation((callback) => {
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
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
