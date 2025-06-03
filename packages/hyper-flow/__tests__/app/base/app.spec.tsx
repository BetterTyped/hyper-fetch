import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

import { Application } from "../../../src/frontend/routing/router";

describe("App", () => {
  it("should render", () => {
    expect(render(<Application />)).toBeTruthy();
  });
});
