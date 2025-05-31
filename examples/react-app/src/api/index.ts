import { setupWorker } from "msw/browser";

import { handlers } from "./mocks";

export * from "./client";

export * from "./files/files.api";
export * from "./users/users.api";

setupWorker(...handlers).start({
  onUnhandledRequest: "bypass",
});
