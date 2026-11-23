/**
 * Loads a built Electron bundle the way Electron does, with `require()`, and reports what it did.
 *
 * Usage: node run-bundle.mjs <bundle.js> <main|preload>
 *
 * Only `electron` is faked, because it is the one module the packaged app gets from the runtime. Everything else in the
 * bundle runs for real, so a bundle that throws while it loads fails here like it fails on launch. The result is printed
 * as one `BUNDLE_RESULT:` line of JSON.
 */
import Module, { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const [bundlePath, processType] = process.argv.slice(2);
const require = createRequire(import.meta.url);

const appEvents = [];
const exposedApis = [];

const report = (error) => {
  const result = { appEvents, exposedApis, error: error ? String(error.stack ?? error) : null };
  process.stdout.write(`\nBUNDLE_RESULT:${JSON.stringify(result)}\n`);
  process.exit(error ? 1 : 0);
};

process.on("uncaughtException", report);
process.on("unhandledRejection", report);

/** Values the app reads during startup. Anything else is a callable stub that returns another stub. */
const overrides = {
  "app.name": "HyperFlow",
  "app.isPackaged": false,
  "app.getName": () => "HyperFlow",
  "app.getVersion": () => "0.0.0",
  "app.getLocale": () => "en-US",
  "app.getAppPath": () => path.dirname(bundlePath),
  "app.getPath": () => os.tmpdir(),
  "app.isReady": () => false,
  // The app never becomes ready here, the spec only checks that the bundle loads and wires itself up
  "app.whenReady": () => new Promise(() => {}),
  "app.on": (event) => {
    appEvents.push(event);
  },
  "app.once": (event) => {
    appEvents.push(event);
  },
  "contextBridge.exposeInMainWorld": (key) => {
    exposedApis.push(key);
  },
};

/**
 * What `require("electron")` exposes in each process. Libraries such as electron-store pick their code path by which of
 * these exist, and bundlers copy a CommonJS module's own keys when they import from it.
 */
const electronModules = {
  main: [
    "app",
    "autoUpdater",
    "BrowserWindow",
    "clipboard",
    "crashReporter",
    "dialog",
    "ipcMain",
    "Menu",
    "nativeImage",
    "nativeTheme",
    "net",
    "Notification",
    "powerMonitor",
    "protocol",
    "safeStorage",
    "screen",
    "session",
    "shell",
    "systemPreferences",
    "utilityProcess",
    "webContents",
  ],
  preload: ["clipboard", "contextBridge", "crashReporter", "ipcRenderer", "nativeImage", "webFrame", "webUtils"],
}[processType];

const createStub = (name) =>
  new Proxy(function stub() {}, {
    ownKeys: (target) => [...Reflect.ownKeys(target), ...(name ? [] : electronModules)],
    getOwnPropertyDescriptor(target, key) {
      if (!name && electronModules.includes(key)) {
        return { configurable: true, enumerable: true, writable: false, value: createStub(key) };
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    get(target, key) {
      if (key === Symbol.toPrimitive) {
        return () => name;
      }
      // A stub is not a promise, awaiting one resolves to it. Electron only has the modules of the current process.
      if (typeof key === "symbol" || key === "then" || (!name && !electronModules.includes(key))) {
        return;
      }
      const child = name ? `${name}.${key}` : key;
      return child in overrides ? overrides[child] : createStub(child);
    },
    apply: (_target, _this, _args) => createStub(`${name}()`),
    construct: (_target, _args) => createStub(`new ${name}`),
  });

const electron = createStub("");

// Electron sets these before it runs the app
Object.defineProperty(process.versions, "electron", { value: "36.6.0", enumerable: true });
process.type = processType === "preload" ? "renderer" : "browser";
process.resourcesPath = path.dirname(bundlePath);
// The app's windows keep Electron's default context isolation
process.contextIsolated = processType === "preload";

if (processType === "preload") {
  // Preload scripts run in the renderer, next to the page
  const { JSDOM } = require("jsdom");
  const { window } = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/index.html" });
  // In the renderer the global scope is the window, so `addEventListener` and friends are globals
  for (const key of ["window", "self"]) {
    Object.defineProperty(globalThis, key, { configurable: true, value: window });
  }
  const windowKeys = [];
  for (let scope = window; scope && scope !== Object.prototype; scope = Object.getPrototypeOf(scope)) {
    windowKeys.push(...Object.getOwnPropertyNames(scope));
  }
  for (const key of new Set(windowKeys)) {
    if (!(key in globalThis)) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        get: () => {
          const value = window[key];
          return typeof value === "function" && /^[a-z]/.test(key) ? value.bind(window) : value;
        },
      });
    }
  }
}

const load = Module._load;
Module._load = function _load(request, ...args) {
  if (request === "electron" || request.startsWith("electron/")) {
    return electron;
  }
  return load.call(this, request, ...args);
};

try {
  require(path.resolve(bundlePath));
} catch (error) {
  report(error);
}

// Let the startup microtasks and timers run before reporting
setTimeout(() => report(null), 100);
