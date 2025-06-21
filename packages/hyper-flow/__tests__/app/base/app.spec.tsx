import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

describe("App", () => {
  it("should render", () => {
    expect(render(<div />)).toBeTruthy();
  });
});
