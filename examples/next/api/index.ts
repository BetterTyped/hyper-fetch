import { setupWorker } from "msw";
import { setupServer } from "msw/node";

import { handlers } from "./mocks";

export * from "./builder";

export * from "./files/files.api";
export * from "./users/users.api";

// Start MSW
if (typeof window === "undefined") {
  setupServer(...handlers).listen();
} else {
  setupWorker(...handlers).start();
}
