import "@testing-library/jest-dom";
import { render, act } from "@testing-library/react";
import { sleep } from "@hyper-fetch/testing";

import { App } from "@/app";

describe("App", () => {
  it("should render", async () => {
    const { container } = render(<App />);
    await act(async () => {
      await sleep(4000);
    });
    expect(container).toBeInTheDocument();
  });
});
