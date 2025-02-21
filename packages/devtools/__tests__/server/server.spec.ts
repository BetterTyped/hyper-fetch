import { startServer } from "../../src/server";
import { connectDevtoolsFrontend, connectDevtoolsClient } from "../helpers/helpers";
import { waitFor } from "@testing-library/react";
// TODO handle lost connection from client
describe("Devtools Socket Server", () => {
  describe("If connection to the frontend is established and client is connected", () => {
    it("Should created the appropriate connections", async () => {
      const { connections, DEVTOOLS_FRONTEND_WS_CONNECTION } = (await startServer()) || {};
      await connectDevtoolsFrontend({
        socketAddress: "localhost",
        socketPort: 1234,
      });
      await connectDevtoolsClient();
      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeDefined();
      await waitFor(() => expect(Object.keys(connections || {}).length).toBeGreaterThan(0));
    });
  });
});
