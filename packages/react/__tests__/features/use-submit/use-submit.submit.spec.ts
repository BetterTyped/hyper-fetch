import { RequestSendType, xhrExtra } from "@hyper-fetch/core";
import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { client, createRequest, renderUseSubmit } from "../../utils";

describe("useSubmit [ Base ]", () => {
  let request = createRequest<null, { value: string }>({ method: "POST" });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    client.clear();
    request = createRequest({ method: "POST" });
  });

  describe("when submit method gets triggered", () => {
    it("should return data from submit method", async () => {
      let data: unknown = null;
      const mock = createRequestInterceptor(request);
      const response = renderUseSubmit(request);

      await act(async () => {
        data = await response.result.current.submit({ data: { value: "string" } });
      });

      expect(data).toStrictEqual({
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "x-powered-by": "msw" } },
      });
    });
    it("should call onSettle", async () => {
      const spy = jest.fn();
      createRequestInterceptor(request);
      const response = renderUseSubmit(request);

      await act(async () => {
        await response.result.current.submit({ data: { value: "string" }, onSettle: spy });
      });

      expect(spy).toBeCalledTimes(1);
    });
    it("should return data from submit method on retries", async () => {
      let data: unknown = null;
      let mock: unknown = {};
      createRequestInterceptor(request, { status: 400 });
      const response = renderUseSubmit(request.setRetry(1).setRetryTime(10));

      await act(async () => {
        response.result.current.onSubmitResponseStart(() => {
          mock = createRequestInterceptor(request);
        });
        data = await response.result.current.submit({ data: { value: "string" } });
      });

      expect(data).toStrictEqual({
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "x-powered-by": "msw" } },
      });
    });
    it("should return data from submit method on offline", async () => {
      let data: unknown = null;
      let mock: unknown = {};
      createRequestInterceptor(request, { status: 400 });
      const response = renderUseSubmit(request.setOffline(true));

      await act(async () => {
        response.result.current.onSubmitResponseStart(() => {
          client.appManager.setOnline(false);
          mock = createRequestInterceptor(request);
          setTimeout(() => {
            client.appManager.setOnline(true);
          }, 100);
        });
        data = await response.result.current.submit({ data: { value: "string" } });
      });

      expect(data).toStrictEqual({
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "x-powered-by": "msw" } },
      });
    });
    it("should allow to change submit details", async () => {
      // Todo
    });
    it("should allow to pass data to submit", async () => {
      let payload: unknown = null;
      const myData = { value: "string" };
      createRequestInterceptor(request);
      const response = renderUseSubmit(request);

      await act(async () => {
        response.result.current.onSubmitRequestStart(({ request: cmd }) => {
          payload = cmd.data;
        });
        response.result.current.submit({ data: myData });
      });

      expect(payload).toStrictEqual(myData);
    });
    it("should allow to pass params to submit", async () => {
      let endpoint: unknown = null;
      const requestWithParams = createRequest({ endpoint: "/users/:userId" });
      createRequestInterceptor(requestWithParams.setParams({ userId: 1 } as any));
      const response = renderUseSubmit(requestWithParams);

      await act(async () => {
        response.result.current.onSubmitRequestStart(({ request: cmd }) => {
          endpoint = cmd.endpoint;
        });
        response.result.current.submit({ params: { userId: 1 } } as any);
      });

      expect(endpoint).toBe("/users/1");
    });
    it("should allow to pass query params to submit", async () => {
      let endpoint: unknown = null;
      createRequestInterceptor(request);
      const response = renderUseSubmit(request);

      await act(async () => {
        response.result.current.onSubmitRequestStart(({ request: cmd }) => {
          endpoint = cmd.endpoint;
        });
        response.result.current.submit({ data: { value: "string" }, queryParams: "?something=test" });
      });

      expect(endpoint).toBe("/shared-endpoint?something=test");
    });
    it("should trigger methods when submit modifies the queue keys", async () => {
      let data: unknown = null;
      const mock = createRequestInterceptor(request);
      const response = renderUseSubmit(request);

      await act(async () => {
        data = await response.result.current.submit({ data: null, queryParams: "?something=test" });
      });

      expect(data).toStrictEqual({
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "x-powered-by": "msw" } },
      });
    });
    it("should throw error when hook is disabled", async () => {
      let res: Awaited<ReturnType<RequestSendType<typeof request>>> = {} as Awaited<
        ReturnType<RequestSendType<typeof request>>
      >;
      createRequestInterceptor(request);
      const response = renderUseSubmit(request, { disabled: true });

      await act(async () => {
        res = await response.result.current.submit({ data: { value: "string" } });
      });

      expect(res.data).toBeNull();
      expect(res.error).toBeInstanceOf(Error);
      expect(res.status).toBe(null);
      expect(res.extra).toStrictEqual(xhrExtra);
    });
    it("should allow to set data on mapped request", async () => {
      let data: unknown = null;
      const mock = createRequestInterceptor(request);
      const mappedRequest = request.setDataMapper(() => new FormData());
      const response = renderUseSubmit(mappedRequest);

      await act(async () => {
        data = await response.result.current.submit({
          data: {
            value: "string",
          },
          queryParams: { something: "test" },
        });
      });

      expect(data).toStrictEqual({
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "x-powered-by": "msw" } },
      });
    });
  });
});
