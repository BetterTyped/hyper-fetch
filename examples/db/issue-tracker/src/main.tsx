import "@picocss/pico/css/pico.min.css";
import "./styles.css";
// Registers the fake backend before the app sends its first request.
import "./server";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
