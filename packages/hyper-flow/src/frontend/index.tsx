import * as Sentry from "@sentry/react";
import { enableMapSet, setAutoFreeze } from "immer";
import * as React from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";

setAutoFreeze(false);
enableMapSet();

createRoot(document.querySelector("#root") as HTMLElement, {
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
    <App />
  </React.StrictMode>,
);
