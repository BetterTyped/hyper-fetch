import { waitFor } from "@testing-library/dom";

import { createClient, createRequest, createEffect } from "../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Effect [ Base ]", () => {
  let client = createClient();
  let request = createRequest(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    client = createClient();
    request = createRequest(client);
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using fetch effects", () => {
    it("should trigger success effects", async () => {
      createRequestInterceptor(request);
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();

      const effect = createEffect(request, {
        onError: spy1,
        onSuccess: spy2,
        onFinished: spy3,
        onStart: spy4,
        onTrigger: spy5,
      });
      client.addEffect(effect);

      request.send();

      await waitFor(() => {
        expect(spy1).toBeCalledTimes(0);
        expect(spy2).toBeCalledTimes(1);
        expect(spy3).toBeCalledTimes(1);
        expect(spy4).toBeCalledTimes(1);
        expect(spy5).toBeCalledTimes(1);
      });
    });
    it("should trigger error effects", async () => {
      createRequestInterceptor(request, { status: 400 });
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();

      const effect = createEffect(request, {
        onError: spy1,
        onSuccess: spy2,
        onFinished: spy3,
        onStart: spy4,
        onTrigger: spy5,
      });
      client.addEffect(effect);

      request.send();

      await waitFor(() => {
        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(0);
        expect(spy3).toBeCalledTimes(1);
        expect(spy4).toBeCalledTimes(1);
        expect(spy5).toBeCalledTimes(1);
      });
    });
    it("should not throw when effects are empty", async () => {
      const effect = createEffect(request);

      expect(effect.onTrigger).not.toThrow();
      expect(effect.onStart).not.toThrow();
      expect(effect.onSuccess).not.toThrow();
      expect(effect.onError).not.toThrow();
      expect(effect.onFinished).not.toThrow();
    });
  });
});
