import { sleep } from "@hyper-fetch/testing";
import { act } from "@testing-library/react";

// Solves the issue: https://github.com/testing-library/react-testing-library/issues/1051
export const waitForRender = async (time = 10) => {
  await act(async () => {
    await sleep(time);
  });
};

/**
 * Errors of the user code (callbacks, listeners, plugins) are thrown from a timer, outside of the request lifecycle.
 * Collects them for the assertions; the listener stays until the timers scheduled by the test have run.
 */
export const collectThrownErrors = () => {
  const errors: unknown[] = [];
  const handler = (error: unknown) => {
    errors.push(error);
  };
  process.on("uncaughtException", handler);
  onTestFinished(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    process.off("uncaughtException", handler);
  });
  return errors;
};
