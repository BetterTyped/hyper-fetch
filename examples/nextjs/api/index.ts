import { setupWorker } from "msw";
import { setupServer } from "msw/lib/node";
import { handlers } from "./mocks";

export * from "./client";

export * from "./files/files.api";
export * from "./users/users.api";

// Start MSW
if (typeof window === "undefined") {
  setupServer(...handlers).listen();
} else {
  setupWorker(...handlers).start();
}
