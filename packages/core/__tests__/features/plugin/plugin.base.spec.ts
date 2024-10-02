import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Client } from "client";
import { Plugin } from "plugin";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Plugin [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-nase-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    jest.resetAllMocks();
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-nase-endpoint" });
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using fetch effects", () => {
    it("should trigger success effects", async () => {
      mockRequest(request);
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();

      const effect = new Plugin({
        name: "123",
      })
        .onRequestError(spy1)
        .onRequestSuccess(spy2)
        .onRequestFinished(spy3)
        .onRequestStart(spy4)
        .onRequestTrigger(spy5);

      client.addPlugin(effect);

      request.send({});

      await waitFor(() => {
        expect(spy1).toHaveBeenCalledTimes(0);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).toHaveBeenCalledTimes(1);
        expect(spy4).toHaveBeenCalledTimes(1);
        expect(spy5).toHaveBeenCalledTimes(1);
      });
    });
    it("should trigger error effects", async () => {
      mockRequest(request, { status: 400 });
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();

      const effect = new Plugin({
        name: "123",
      })
        .onRequestError(spy1)
        .onRequestSuccess(spy2)
        .onRequestFinished(spy3)
        .onRequestStart(spy4)
        .onRequestTrigger(spy5);

      client.addPlugin(effect);

      request.send({});

      await waitFor(() => {
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(0);
        expect(spy3).toHaveBeenCalledTimes(1);
        expect(spy4).toHaveBeenCalledTimes(1);
        expect(spy5).toHaveBeenCalledTimes(1);
      });
    });
    it("should not throw when effects are empty", async () => {
      const effect = new Plugin({
        name: "123",
      });

      expect(effect.onRequestTrigger).not.toThrow();
      expect(effect.onRequestStart).not.toThrow();
      expect(effect.onRequestSuccess).not.toThrow();
      expect(effect.onRequestError).not.toThrow();
      expect(effect.onRequestFinished).not.toThrow();
    });
  });
});
