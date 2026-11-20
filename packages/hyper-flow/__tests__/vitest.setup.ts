/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import * as matchers from "jest-extended";
import { expect, vi } from "vitest";

import { configureImmer } from "@/lib/immer";

expect.extend(matchers);
configureImmer();

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * In-memory stand-in for electron-store, so persisted stores behave like in the desktop app.
 */
const electronStore = new Map<string, unknown>();

export const resetElectronStore = () => {
  electronStore.clear();
};

// Main-process specs run in Node, everything below is the renderer's browser
if (typeof window !== "undefined") {
  setupRendererEnvironment();
}

function setupRendererEnvironment() {
  const electronApiMock = {
    store: {
      get: vi.fn((key: string) => electronStore.get(key) ?? null),
      set: vi.fn((key: string, value: unknown) => {
        electronStore.set(key, value);
      }),
      delete: vi.fn((key: string) => {
        electronStore.delete(key);
      }),
    },
    getAppVersion: vi.fn().mockReturnValue("1.0.0"),
    // The devtools server runs in the main process; specs start their own and see it as running
    server: {
      status: vi.fn(() => true),
      restart: vi.fn(async (options?: { port?: number }) => ({
        running: true,
        port: options?.port ?? 2137,
        success: true,
        message: "",
      })),
      onStatusChange: vi.fn().mockImplementation((callback: (status: boolean) => void) => {
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
    value: vi.fn().mockImplementation((query: string) => ({
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

  // Radix and recharts measure the layout, which jsdom does not implement.
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverMock as unknown as typeof ResizeObserver);
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? vi.fn();
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture ?? (() => false);
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture ?? vi.fn();
  // jsdom has no canvas backend; components that draw on one get no context and skip drawing.
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"];
}
