import { screen } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";

describe("Dashboard [ Tutorial ]", () => {
  const env = createHyperFlowEnv();

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await env.stop();
    vi.restoreAllMocks();
  });

  it("should open the plugin setup guide in the browser", async () => {
    // Electron hands window.open over to the system browser
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const view = env.renderApp();

    await view.user.click(await screen.findByText("Cannot see your application?"));

    expect(open).toHaveBeenCalledWith("https://hyperfetch.bettertyped.com/docs/integrations/plugin-devtools", "_blank");
  });
});
