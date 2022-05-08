import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCommand } from "../../utils";

describe("FetchBuilder [ Auth ]", () => {
  const commandFixture = { data: "" };

  const refreshFixture = { token: "new-token" };
  const refreshEndpoint = "/refresh-token";

  let builder = createBuilder();
  let command = createCommand(builder).setAuth(false);
  let authCommand = createCommand(builder, { endpoint: "/auth" }).setAuth(true);
  let refreshCommand = createCommand(builder, { endpoint: refreshEndpoint });

  beforeEach(() => {
    createRequestInterceptor(refreshCommand, { fixture: refreshFixture });
  });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builder = createBuilder();
    command = createCommand(builder).setAuth(false);
    authCommand = createCommand(builder).setAuth(true);
    refreshCommand = createCommand(builder, { endpoint: refreshEndpoint });
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When authenticated command get send", () => {
    it("should trigger auth middleware callback", async () => {
      createRequestInterceptor(authCommand, { fixture: commandFixture });

      const trigger = jest.fn();

      builder.onAuth((cmd) => {
        trigger();
        return cmd;
      });

      await authCommand.send();

      expect(trigger).toBeCalledTimes(1);
    });
  });

  describe("When non-authenticated command get send", () => {
    it("should trigger auth middleware callback", async () => {
      createRequestInterceptor(command, { fixture: commandFixture });

      const trigger = jest.fn();

      builder.onAuth((cmd) => {
        trigger();
        return cmd;
      });

      await command.send();

      expect(trigger).toBeCalledTimes(0);
    });
  });

  describe("When token is out of date", () => {
    const interceptor = jest.fn();

    const handleErrorIntercept = (callback?: () => void) => {
      builder.onError(async (res, cmd) => {
        interceptor();
        const status = res[2];

        if (!cmd.used && status === 401) {
          const [data] = await refreshCommand.send();
          if (data) {
            callback?.();
            return cmd.setUsed(true).send();
          }
        }
        return res;
      });
    };

    it("should intercept error response and get the data with new token", async () => {
      createRequestInterceptor(command, { status: 401 });

      handleErrorIntercept(() => createRequestInterceptor(command, { fixture: commandFixture }));

      const [data] = await command.send();

      expect(data).toEqual(commandFixture);
      expect(interceptor).toBeCalledTimes(1);
    });
    it("should intercept error response and return error after another failure", async () => {
      const errorResponse = createRequestInterceptor(command, { status: 401 });

      handleErrorIntercept();
      const [data, error] = await command.send();

      expect(data).toBe(null);
      expect(error).toEqual(errorResponse);
      expect(interceptor).toBeCalledTimes(2);
    });

    it("should try to repeat request only once", async () => {
      createRequestInterceptor(command, { status: 401 });

      const retry = jest.fn();

      handleErrorIntercept(retry);

      await command.send();

      expect(retry).toBeCalledTimes(1);
    });
  });
});
