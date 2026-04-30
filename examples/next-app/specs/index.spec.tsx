import { render } from "@testing-library/react";
import React from "react";

import Index from "../pages/index";

describe("Index", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Index />);
    expect(baseElement).toBeTruthy();
  });
});
