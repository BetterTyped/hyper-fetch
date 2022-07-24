import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand, renderUseSubmit } from "../../utils";

describe("useSubmit [ Base ]", () => {
  let command = createCommand({ method: "POST" });

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
    builder.clear();
    command = createCommand({ method: "POST" });
  });

  describe("when submit method gets triggered", () => {
    it("should return data from submit method", async () => {
      let data: unknown = null;
      const mock = createRequestInterceptor(command);
      const response = renderUseSubmit(command);

      await act(async () => {
        data = await response.result.current.submit();
      });

      expect(data).toStrictEqual([mock, null, 200]);
    });
    it("should return data from submit method on retries", async () => {
      let data: unknown = null;
      let mock: unknown = {};
      createRequestInterceptor(command, { status: 400 });
      const response = renderUseSubmit(command.setRetry(1).setRetryTime(10));

      await act(async () => {
        response.result.current.onSubmitResponseStart(() => {
          mock = createRequestInterceptor(command);
        });
        data = await response.result.current.submit();
      });

      expect(data).toStrictEqual([mock, null, 200]);
    });
    it("should return data from submit method on offline", async () => {
      let data: unknown = null;
      let mock: unknown = {};
      createRequestInterceptor(command, { status: 400 });
      const response = renderUseSubmit(command.setOffline(true));

      await act(async () => {
        response.result.current.onSubmitResponseStart(() => {
          builder.appManager.setOnline(false);
          mock = createRequestInterceptor(command);
          setTimeout(() => {
            builder.appManager.setOnline(true);
          }, 100);
        });
        data = await response.result.current.submit();
      });

      expect(data).toStrictEqual([mock, null, 200]);
    });
    it("should allow to change submit details", async () => {
      // Todo
    });
    it("should allow to pass data to submit", async () => {
      let payload: unknown = null;
      const myData = { userId: 1 };
      createRequestInterceptor(command);
      const response = renderUseSubmit(command);

      await act(async () => {
        response.result.current.onSubmitRequestStart(({ command: cmd }) => {
          payload = cmd.data;
        });
        response.result.current.submit({ data: myData });
      });

      expect(payload).toStrictEqual(myData);
    });
    it("should allow to pass params to submit", async () => {
      let endpoint: unknown = null;
      const commandWithParams = createCommand({ endpoint: "/users/:userId" });
      createRequestInterceptor(commandWithParams.setParams({ userId: 1 } as any));
      const response = renderUseSubmit(commandWithParams);

      await act(async () => {
        response.result.current.onSubmitRequestStart(({ command: cmd }) => {
          endpoint = cmd.endpoint;
        });
        response.result.current.submit({ params: { userId: 1 } } as any);
      });

      expect(endpoint).toBe("/users/1");
    });
    it("should allow to pass query params to submit", async () => {
      let endpoint: unknown = null;
      createRequestInterceptor(command);
      const response = renderUseSubmit(command);

      await act(async () => {
        response.result.current.onSubmitRequestStart(({ command: cmd }) => {
          endpoint = cmd.endpoint;
        });
        response.result.current.submit({ queryParams: "?something=test" });
      });

      expect(endpoint).toBe("/shared-endpoint?something=test");
    });
    it("should trigger methods when submit modifies the queue keys", async () => {
      let data: unknown = null;
      const mock = createRequestInterceptor(command);
      const response = renderUseSubmit(command);

      await act(async () => {
        data = await response.result.current.submit({ queryParams: "?something=test" });
      });

      expect(data).toStrictEqual([mock, null, 200]);
    });
    it("should throw when hook is disabled", async () => {
      const response = renderUseSubmit(command, { disabled: true });

      expect(response.result.current.submit).toThrow();
    });
  });
});
