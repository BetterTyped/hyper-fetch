import * as React from "react";
import { createRoot } from "react-dom/client";
import { enableMapSet, setAutoFreeze } from "immer";
import * as Sentry from "@sentry/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

setAutoFreeze(false);
enableMapSet();

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const memoryHistory = createMemoryHistory({
  initialEntries: ["/"], // Pass your initial url
});

createRoot(document.getElementById("root") as HTMLElement, {
  // Callback called when an error is thrown and not caught by an ErrorBoundary.
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn("Uncaught error", error, errorInfo.componentStack);
  }),
  // Callback called when React catches an error in an ErrorBoundary.
  onCaughtError: Sentry.reactErrorHandler(),
  // Callback called when React automatically recovers from errors.
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <React.StrictMode>
    <RouterProvider router={router} history={memoryHistory} />
  </React.StrictMode>,
);
