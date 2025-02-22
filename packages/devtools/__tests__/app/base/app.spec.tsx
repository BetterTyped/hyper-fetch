import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

import App from "../../../src/frontend/app";

describe("App", () => {
  it("should render", () => {
    expect(render(<App />)).toBeTruthy();
  });
});
