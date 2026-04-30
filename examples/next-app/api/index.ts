import { handlers } from "./mocks";

export * from "./client";

export * from "./files/files.api";
export * from "./users/users.api";

// Start MSW
if (typeof window === "undefined") {
  void import("msw/node").then(({ setupServer }) => {
    setupServer(...handlers).listen();
  });
} else {
  void import("msw/browser").then(({ setupWorker }) => {
    void setupWorker(...handlers).start();
  });
}
