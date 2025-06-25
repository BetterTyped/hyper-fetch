import { sleep } from "@hyper-fetch/testing";
import { act } from "@testing-library/react";

// Solves the issue: https://github.com/testing-library/react-testing-library/issues/1051
export const waitForRender = async (time = 10) => {
  await act(async () => {
    await sleep(time);
  });
};
