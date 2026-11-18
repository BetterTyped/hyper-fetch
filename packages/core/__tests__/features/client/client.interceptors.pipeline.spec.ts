import type { ResponseType } from "adapter";
import { Client } from "client";
import type { HttpAdapterType } from "http-adapter";
import { xhrExtra } from "http-adapter";
import { LoggerManager } from "managers";
import type { RequestInstance } from "request";

import { getUnhandledRejections } from "../../utils/fixtures.utils";

type Data = Record<string, unknown>;

const defaultData: Data = { id: 1 };

const createResponse = (
  overrides: Partial<ResponseType<Data, Error, HttpAdapterType>> = {},
): ResponseType<Data, Error, HttpAdapterType> => ({
  data: {},
  error: null,
  status: 200,
  success: true,
  extra: xhrExtra,
  requestTimestamp: Date.now(),
  responseTimestamp: Date.now(),
  ...overrides,
});

describe("Client [ Interceptors Pipeline ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
  let sentRequest: RequestInstance | undefined;

  const mockSuccess = (data: Data = defaultData) => {
    const mock = vi.fn(({ request: sent }: { request: RequestInstance }) => {
      sentRequest = sent;
      return { data, status: 200 };
    });
    request.setMock(mock);
    return mock;
  };

  const mockError = (error = new Error("Server error")) => {
    const mock = vi.fn(() => ({ error, status: 400 }));
    request.setMock(mock);
    return mock;
  };

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
    sentRequest = undefined;
  });

  afterEach(() => {
    client.clear();
  });

  describe("When request interceptors are chained", () => {
    it("should run them in the order they were added", async () => {
      const order: string[] = [];
      client
        .onRequest(async (req) => {
          await Promise.resolve();
          order.push("first");
          return req;
        })
        .onRequest((req) => {
          order.push("second");
          return req;
        })
        .onRequest(async (req) => {
          order.push("third");
          return req;
        });

      await client.unstable_modifyRequest(request);

      expect(order).toStrictEqual(["first", "second", "third"]);
    });

    it("should pass the request returned by the previous interceptor to the next one", async () => {
      client
        .onRequest((req) => req.setHeaders({ ...req.headers, first: "1" }))
        .onRequest((req) => req.setHeaders({ ...req.headers, second: "2" }))
        .onRequest((req) => req.setHeaders({ ...req.headers, third: "3" }));

      const modified = await client.unstable_modifyRequest(request);

      expect(modified.headers).toStrictEqual({ first: "1", second: "2", third: "3" });
    });

    it("should send the request modified by every interceptor", async () => {
      mockSuccess();
      client
        .onRequest((req) => req.setHeaders({ ...req.headers, first: "1" }))
        .onRequest(async (req) => req.setHeaders({ ...req.headers, second: "2" }));

      await request.send();

      expect(sentRequest?.headers).toStrictEqual({ first: "1", second: "2" });
    });

    it("should not change the original request", async () => {
      mockSuccess();
      client.onRequest((req) => req.setHeaders({ ...req.headers, first: "1" }));

      await request.send();

      expect(request.headers).toBeUndefined();
    });

    it("should return the original request when there are no interceptors", async () => {
      await expect(client.unstable_modifyRequest(request)).resolves.toBe(request);
      await expect(client.unstable_modifyAuth(request)).resolves.toBe(request);
    });

    it("should run the interceptor added twice two times", async () => {
      const interceptor = vi.fn((req: RequestInstance) => req);
      client.onRequest(interceptor).onRequest(interceptor);

      await client.unstable_modifyRequest(request);

      expect(interceptor).toHaveBeenCalledTimes(2);
    });

    it("should skip the interceptors when the request disables them", async () => {
      const onRequest = vi.fn((req: RequestInstance) => req);
      const onAuth = vi.fn((req: RequestInstance) => req);
      client.onRequest(onRequest).onAuth(onAuth);
      const disabled = client.createRequest<{ response: Data }>()({
        endpoint: "/users",
        auth: true,
        disableRequestInterceptors: true,
      });
      disabled.setMock(() => ({ data: {}, status: 200 }));

      const response = await disabled.send();

      expect(response.success).toBeTrue();
      expect(onRequest).not.toHaveBeenCalled();
      expect(onAuth).not.toHaveBeenCalled();
    });

    it("should stop calling the removed interceptors", async () => {
      const removed = vi.fn((req: RequestInstance) => req);
      const kept = vi.fn((req: RequestInstance) => req);
      client.onRequest(removed).onRequest(kept).onRequest(removed);

      client.removeOnRequestInterceptors([removed]);
      client.removeOnRequestInterceptors([() => request]);
      await client.unstable_modifyRequest(request);

      expect(removed).not.toHaveBeenCalled();
      expect(kept).toHaveBeenCalledTimes(1);
    });
  });

  describe("When auth interceptors are used", () => {
    it("should run them for the requests by default", async () => {
      const onAuth = vi.fn((req: RequestInstance) => req);
      mockSuccess();
      client.onAuth(onAuth);

      await request.send();

      expect(request.auth).toBeTrue();
      expect(onAuth).toHaveBeenCalledTimes(1);
    });

    it("should not run them for the requests with the auth disabled", async () => {
      const onAuth = vi.fn((req: RequestInstance) => req);
      const publicRequest = request.setAuth(false);
      publicRequest.setMock(() => ({ data: {}, status: 200 }));
      client.onAuth(onAuth);

      const response = await publicRequest.send();

      expect(response.success).toBeTrue();
      expect(onAuth).not.toHaveBeenCalled();
    });

    it("should run them after the request interceptors with the request they returned", async () => {
      const order: string[] = [];
      let authInput: RequestInstance | undefined;
      const authRequest = request.setAuth(true);
      authRequest.setMock(({ request: sent }) => {
        sentRequest = sent;
        return { data: {}, status: 200 };
      });
      client
        .onAuth((req) => {
          order.push("auth");
          authInput = req;
          return req.setHeaders({ ...req.headers, Authorization: "Bearer token" });
        })
        .onRequest((req) => {
          order.push("request");
          return req.setHeaders({ ...req.headers, "x-trace": "1" });
        });

      await authRequest.send();

      expect(order).toStrictEqual(["request", "auth"]);
      expect(authInput?.headers).toStrictEqual({ "x-trace": "1" });
      expect(sentRequest?.headers).toStrictEqual({ "x-trace": "1", Authorization: "Bearer token" });
    });

    it("should chain many auth interceptors", async () => {
      client
        .onAuth((req) => req.setHeaders({ ...req.headers, first: "1" }))
        .onAuth((req) => req.setHeaders({ ...req.headers, second: "2" }));

      const modified = await client.unstable_modifyAuth(request);

      expect(modified.headers).toStrictEqual({ first: "1", second: "2" });
    });

    it("should stop calling the removed auth interceptors", async () => {
      const removed = vi.fn((req: RequestInstance) => req);
      client.onAuth(removed);

      client.removeOnAuthInterceptors([removed]);
      await client.unstable_modifyAuth(request);

      expect(removed).not.toHaveBeenCalled();
    });
  });

  describe("When request interceptors fail", () => {
    it.each([
      {
        name: "throws",
        interceptor: () => {
          throw new Error("Interceptor failed");
        },
        message: "Interceptor failed",
      },
      {
        name: "rejects",
        interceptor: () => Promise.reject(new Error("Interceptor failed")),
        message: "Interceptor failed",
      },
      {
        name: "returns nothing",
        interceptor: () => undefined as unknown as RequestInstance,
        message: "Request modifier must return request",
      },
    ])("should end the request with the error when the interceptor $name", async ({ interceptor, message }) => {
      const mock = mockSuccess();
      const next = vi.fn((req: RequestInstance) => req);
      client.onRequest(interceptor).onRequest(next);

      let response: Awaited<ReturnType<typeof request.send>> | undefined;
      const rejections = await getUnhandledRejections(async () => {
        response = await request.send();
      });

      expect(rejections).toHaveLength(0);
      expect(response?.success).toBeFalse();
      expect(response?.data).toBeNull();
      expect(response?.error?.message).toBe(message);
      expect(mock).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(request.read()).toBeUndefined();
    });

    it("should end the request with the error when the auth interceptor fails", async () => {
      const authRequest = request.setAuth(true);
      const mock = vi.fn(() => ({ data: {}, status: 200 }));
      authRequest.setMock(mock);
      client.onAuth(() => {
        throw new Error("Auth failed");
      });

      const response = await authRequest.send();

      expect(response.success).toBeFalse();
      expect(response.error?.message).toBe("Auth failed");
      expect(mock).not.toHaveBeenCalled();
    });

    it("should handle the next request after the failed one", async () => {
      mockSuccess();
      let shouldFail = true;
      client.onRequest((req) => {
        if (shouldFail) {
          throw new Error("Interceptor failed");
        }
        return req;
      });

      const failed = await request.send();
      shouldFail = false;
      const succeeded = await request.send();

      expect(failed.success).toBeFalse();
      expect(succeeded.success).toBeTrue();
      expect(succeeded.data).toStrictEqual({ id: 1 });
    });
  });

  describe("When response interceptors are chained", () => {
    it("should pass the response returned by the previous interceptor to the next one", async () => {
      client
        .onResponse((response) => ({ ...response, data: { ...response.data, first: 1 } }))
        .onResponse(async (response) => ({ ...response, data: { ...response.data, second: 2 } }))
        .onResponse((response) => ({ ...response, data: { ...response.data, third: 3 } }));

      const modified = await client.unstable_modifyResponse(createResponse({ data: { id: 1 } }), request);

      expect(modified.data).toStrictEqual({ id: 1, first: 1, second: 2, third: 3 });
    });

    it("should chain the success interceptors", async () => {
      client
        .onSuccess((response) => ({ ...response, data: { ...response.data, first: 1 } }))
        .onSuccess((response) => ({ ...response, data: { ...response.data, second: 2 } }));

      const modified = await client.unstable_modifySuccessResponse(createResponse({ data: { id: 1 } }), request);

      expect(modified.data).toStrictEqual({ id: 1, first: 1, second: 2 });
    });

    it("should chain the error interceptors", async () => {
      client
        .onError((response) => ({ ...response, status: 401 }))
        .onError((response) => ({ ...response, error: new Error(`Status ${response.status}`) }));

      const modified = await client.unstable_modifyErrorResponse(
        createResponse({ data: null, success: false, status: 400, error: new Error("Failed") }),
        request,
      );

      expect(modified.status).toBe(401);
      expect(modified.error?.message).toBe("Status 401");
    });

    it("should pass the request to every interceptor", async () => {
      const interceptor = vi.fn((response: ResponseType<any, any, HttpAdapterType>) => response);
      client.onResponse(interceptor).onResponse(interceptor);

      await client.unstable_modifyResponse(createResponse(), request);

      expect(interceptor).toHaveBeenCalledTimes(2);
      expect(interceptor.mock.calls.every((call) => (call as unknown[])[1] === request)).toBeTrue();
    });

    it("should return the original response when there are no interceptors", async () => {
      const response = createResponse();

      await expect(client.unstable_modifyResponse(response, request)).resolves.toBe(response);
      await expect(client.unstable_modifySuccessResponse(response, request)).resolves.toBe(response);
      await expect(client.unstable_modifyErrorResponse(response, request)).resolves.toBe(response);
    });

    it("should run the general interceptors before the success ones", async () => {
      const order: string[] = [];
      mockSuccess();
      client
        .onSuccess((response) => {
          order.push("success");
          return response;
        })
        .onError((response) => {
          order.push("error");
          return response;
        })
        .onResponse((response) => {
          order.push("response");
          return response;
        });

      await request.send();

      expect(order).toStrictEqual(["response", "success"]);
    });

    it("should run the general interceptors before the error ones", async () => {
      const order: string[] = [];
      mockError();
      client
        .onSuccess((response) => {
          order.push("success");
          return response;
        })
        .onError((response) => {
          order.push("error");
          return response;
        })
        .onResponse((response) => {
          order.push("response");
          return response;
        });

      await request.send();

      expect(order).toStrictEqual(["response", "error"]);
    });

    it("should resolve and cache the response modified by every interceptor", async () => {
      mockSuccess({ id: 1 });
      client
        .onResponse((response) => ({ ...response, data: { ...response.data, general: true } }))
        .onSuccess((response) => ({ ...response, data: { ...response.data, success: true } }));

      const response = await request.send();

      expect(response.data).toStrictEqual({ id: 1, general: true, success: true });
      expect(request.read()?.data).toStrictEqual({ id: 1, general: true, success: true });
    });

    it("should let the error interceptor recover the request", async () => {
      mockError();
      client.onError((response) => ({ ...response, data: { recovered: true }, error: null, success: true }));

      const response = await request.send();

      expect(response.success).toBeTrue();
      expect(response.data).toStrictEqual({ recovered: true });
      expect(request.read()?.data).toStrictEqual({ recovered: true });
    });

    it("should skip the interceptors when the request disables them", async () => {
      const interceptor = vi.fn((response: ResponseType<any, any, HttpAdapterType>) => response);
      client.onResponse(interceptor).onSuccess(interceptor).onError(interceptor);
      const disabled = client.createRequest<{ response: Data }>()({
        endpoint: "/users",
        disableResponseInterceptors: true,
      });
      disabled.setMock(() => ({ data: { id: 1 }, status: 200 }));

      const response = await disabled.send();

      expect(response.data).toStrictEqual({ id: 1 });
      expect(interceptor).not.toHaveBeenCalled();
    });

    it("should stop calling the removed interceptors", async () => {
      const removed = vi.fn((response: ResponseType<any, any, HttpAdapterType>) => response);
      const kept = vi.fn((response: ResponseType<any, any, HttpAdapterType>) => response);
      client.onResponse(removed).onResponse(kept).onSuccess(removed).onError(removed);

      client
        .removeOnResponseInterceptors([removed])
        .removeOnSuccessInterceptors([removed])
        .removeOnErrorInterceptors([removed]);
      await client.unstable_modifyResponse(createResponse(), request);
      await client.unstable_modifySuccessResponse(createResponse(), request);
      await client.unstable_modifyErrorResponse(createResponse(), request);

      expect(removed).not.toHaveBeenCalled();
      expect(kept).toHaveBeenCalledTimes(1);
    });
  });

  describe("When response interceptors fail", () => {
    const failures = [
      {
        name: "throws",
        interceptor: () => {
          throw new Error("Interceptor failed");
        },
        message: "Interceptor failed",
      },
      {
        name: "rejects",
        interceptor: () => Promise.reject(new Error("Interceptor failed")),
        message: "Interceptor failed",
      },
      {
        name: "returns nothing",
        interceptor: () => undefined as unknown as ResponseType<any, any, HttpAdapterType>,
        message: "Response modifier must return data",
      },
    ];

    it.each(failures)(
      "should end the successful request with the error when the general interceptor $name",
      async ({ interceptor, message }) => {
        mockSuccess();
        const next = vi.fn((response: ResponseType<any, any, HttpAdapterType>) => response);
        client.onResponse(interceptor).onResponse(next);

        let response: Awaited<ReturnType<typeof request.send>> | undefined;
        const rejections = await getUnhandledRejections(async () => {
          response = await request.send();
        });

        expect(rejections).toHaveLength(0);
        expect(response?.success).toBeFalse();
        expect(response?.data).toBeNull();
        expect(response?.status).toBe(0);
        expect(response?.error?.message).toBe(message);
        expect(next).not.toHaveBeenCalled();
        expect(request.read()).toBeUndefined();
      },
    );

    it.each(failures)(
      "should end the successful request with the error when the success interceptor $name",
      async ({ interceptor, message }) => {
        mockSuccess();
        client.onSuccess(interceptor);

        let response: Awaited<ReturnType<typeof request.send>> | undefined;
        const rejections = await getUnhandledRejections(async () => {
          response = await request.send();
        });

        expect(rejections).toHaveLength(0);
        expect(response?.success).toBeFalse();
        expect(response?.error?.message).toBe(message);
        expect(request.read()).toBeUndefined();
      },
    );

    it.each(failures)(
      "should end the failed request with the error when the error interceptor $name",
      async ({ interceptor, message }) => {
        mockError();
        client.onError(interceptor);

        let response: Awaited<ReturnType<typeof request.send>> | undefined;
        const rejections = await getUnhandledRejections(async () => {
          response = await request.send();
        });

        expect(rejections).toHaveLength(0);
        expect(response?.success).toBeFalse();
        expect(response?.data).toBeNull();
        expect(response?.error?.message).toBe(message);
      },
    );

    it("should keep the timestamps of the intercepted response", async () => {
      const response = createResponse({ requestTimestamp: 100, responseTimestamp: 200 });
      client.onResponse(() => {
        throw new Error("Interceptor failed");
      });

      const modified = await client.unstable_modifyResponse(response, request);

      expect(modified).toStrictEqual({
        data: null,
        error: new Error("Interceptor failed"),
        status: 0,
        success: false,
        extra: xhrExtra,
        requestTimestamp: 100,
        responseTimestamp: 200,
      });
    });

    it("should log the failure of the interceptor", async () => {
      const logger = vi.fn();
      client.setDebug(true).setLogger(() => new LoggerManager({ logger }));
      client.onResponse(() => {
        throw new Error("Interceptor failed");
      });

      await client.unstable_modifyResponse(createResponse(), request);

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger.mock.calls[0][0]).toStrictEqual(
        expect.objectContaining({ level: "error", module: "Client", title: "Response interceptor failed" }),
      );
    });

    it("should handle the next request after the failed one", async () => {
      mockSuccess();
      let shouldFail = true;
      client.onResponse((response) => {
        if (shouldFail) {
          throw new Error("Interceptor failed");
        }
        return response;
      });

      const failed = await request.send();
      shouldFail = false;
      const succeeded = await request.send();

      expect(failed.success).toBeFalse();
      expect(succeeded.success).toBeTrue();
      expect(request.read()?.data).toStrictEqual({ id: 1 });
    });

    it("should end the request sent without the dispatcher with the error", async () => {
      mockSuccess();
      client.onSuccess(() => {
        throw new Error("Interceptor failed");
      });

      const response = await request.exec();

      expect(response.success).toBeFalse();
      expect(response.error?.message).toBe("Interceptor failed");
    });
  });
});
