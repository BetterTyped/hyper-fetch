import * as React from "react";
import { createRoot } from "react-dom/client";
import { enableMapSet, setAutoFreeze } from "immer";

import { App } from "./app";

setAutoFreeze(false);
enableMapSet();

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
