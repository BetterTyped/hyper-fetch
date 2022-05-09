import { getClientBindings } from "client";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCommand } from "../../utils";

describe("Fetch Client [ Bindings ]", () => {
  const requestId = "test";

  let builder = createBuilder();
  let command = createCommand(builder);
  let bindings: Awaited<ReturnType<typeof getClientBindings>>;

  beforeEach(async () => {
    builder = createBuilder();
    command = createCommand(builder);
    bindings = await getClientBindings(command, requestId);
    resetInterceptors();
  });

  beforeAll(() => {
    startServer();
  });

  afterEach(async () => {
    builder = createBuilder();
    command = createCommand(builder);
    bindings = await getClientBindings(command, requestId);
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  it("should add AbortController on client execution", async () => {
    expect(bindings.getAbortController()).toBeDefined();
  });
});
