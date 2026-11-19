/**
 * A browser API class of the page. Runtimes without a `window` (Node.js, server-side rendering) get none on purpose:
 * sockets created during a server render must not connect from the server. Pass the class in the adapter options
 * to connect there.
 */
export const getWindowImplementation = <Name extends "WebSocket" | "EventSource">(
  name: Name,
): (typeof globalThis)[Name] | undefined => {
  try {
    if (typeof window !== "undefined") {
      return window?.[name];
    }
  } catch {
    // Accessing `window` can throw in sandboxed environments
  }
  return undefined;
};
