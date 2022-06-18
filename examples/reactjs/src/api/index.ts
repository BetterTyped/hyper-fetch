import { setupWorker } from "msw";
import { handlers } from "./mocks";

export * from "./builder";

export * from "./files/files.api";
export * from "./users/users.api";

// Start MSW
setupWorker(...handlers).start();
