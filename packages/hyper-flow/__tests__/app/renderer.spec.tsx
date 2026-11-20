import { screen } from "@testing-library/react";

vi.mock("@sentry/electron/renderer", () => ({ init: vi.fn(), browserTracingIntegration: vi.fn() }));

describe("Renderer entry", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should mount HyperFlow into the root element", async () => {
    const root = document.createElement("div");
    root.id = "root";
    document.body.append(root);

    await import("@app/renderer");

    // The sidebar and the page heading
    expect(await screen.findAllByText("Applications", {}, { timeout: 5000 })).not.toHaveLength(0);
    expect(root.childElementCount).toBeGreaterThan(0);
  });
});
