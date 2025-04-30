import * as React from "react";
import { createRoot } from "react-dom/client";
import { enableMapSet, setAutoFreeze } from "immer";
import * as Sentry from "@sentry/react";

import { Application } from "./routing/router";

setAutoFreeze(false);
enableMapSet();

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
    <Application />
  </React.StrictMode>,
);
