import { act } from "@testing-library/react";

export const sleep = async (ms: number) => {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((r) => setTimeout(r, ms));
};

// Solves the issue: https://github.com/testing-library/react-testing-library/issues/1051
export const waitForRender = () =>
  act(async () => {
    await sleep(50);
  });
