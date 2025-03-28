import * as React from "react";
import { createRoot } from "react-dom/client";
import { setAutoFreeze } from "immer";

import { App } from "./app";

setAutoFreeze(false);

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
