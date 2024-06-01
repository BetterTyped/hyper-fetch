import { Client } from "client";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Client [ Auth ]", () => {
  const requestFixture = { data: "" };

  const refreshFixture = { token: "new-token" };
  const refreshEndpoint = "/refresh-token";

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<any>()({ endpoint: "/shared-endpoint" }).setAuth(false);
  let authRequest = client.createRequest<any>()({ endpoint: "/auth" }).setAuth(true);
  let refreshRequest = client.createRequest<any>()({ endpoint: refreshEndpoint });

  beforeEach(() => {
    createRequestInterceptor(refreshRequest, { fixture: refreshFixture });
  });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "/shared-endpoint" }).setAuth(false);
    authRequest = client.createRequest()({ endpoint: "/auth" }).setAuth(true);
    refreshRequest = client.createRequest()({ endpoint: refreshEndpoint });
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When authenticated request get send", () => {
    it("should trigger auth middleware callback", async () => {
      createRequestInterceptor(authRequest, { fixture: requestFixture });

      const trigger = jest.fn();

      client.onAuth((cmd) => {
        trigger();
        return cmd;
      });

      await authRequest.send();

      expect(trigger).toHaveBeenCalledTimes(1);
    });
  });

  describe("When non-authenticated request get send", () => {
    it("should trigger auth middleware callback", async () => {
      createRequestInterceptor(request, { fixture: requestFixture });

      const trigger = jest.fn();

      client.onAuth((cmd) => {
        trigger();
        return cmd;
      });

      await request.send();

      expect(trigger).toHaveBeenCalledTimes(0);
    });
  });

  describe("When token is out of date", () => {
    const interceptor = jest.fn();

    const handleErrorIntercept = (callback?: () => void) => {
      client.onError(async (res, req) => {
        interceptor();
        const { status } = res;

        if (!req.used && status === 401) {
          const { data } = await refreshRequest.send();
          if (data) {
            callback?.();
            return req.setUsed(true).send({});
          }
        }
        return res;
      });
    };

    it("should intercept error response and get the data with new token", async () => {
      createRequestInterceptor(request, { status: 401 });

      handleErrorIntercept(() => createRequestInterceptor(request, { fixture: requestFixture }));

      const response = await request.send();
      expect(response.data).toEqual(requestFixture);
      expect(interceptor).toHaveBeenCalledTimes(1);
    });
    it("should intercept error response and return error after another failure", async () => {
      const errorResponse = createRequestInterceptor(request, { status: 401 });

      handleErrorIntercept();
      const { data, error } = await request.send();

      expect(data).toBe(null);
      expect(error).toEqual(errorResponse);
      expect(interceptor).toHaveBeenCalledTimes(2);
    });

    it("should try to repeat request only once", async () => {
      createRequestInterceptor(request, { status: 401 });

      const retry = jest.fn();

      handleErrorIntercept(retry);

      await request.send();

      expect(retry).toHaveBeenCalledTimes(1);
    });
  });
});
