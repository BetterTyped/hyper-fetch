import { setupWorker } from "msw";

import { handlers } from "./mocks";

export * from "./client";

export * from "./files/files.api";
export * from "./users/users.api";

setupWorker(...handlers).start();
