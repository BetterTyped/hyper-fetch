import { waitFor } from "@testing-library/dom";

import { createBuilder, createCommand, createEffect } from "../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Effect [ Base ]", () => {
  let builder = createBuilder();
  let command = createCommand(builder);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    builder = createBuilder();
    command = createCommand(builder);
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using fetch effects", () => {
    it("should trigger success effects", async () => {
      createRequestInterceptor(command);
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();

      const effect = createEffect(command, {
        onError: spy1,
        onSuccess: spy2,
        onFinished: spy3,
        onStart: spy4,
        onTrigger: spy5,
      });
      builder.addEffect(effect);

      command.send();

      await waitFor(() => {
        expect(spy1).toBeCalledTimes(0);
        expect(spy2).toBeCalledTimes(1);
        expect(spy3).toBeCalledTimes(1);
        expect(spy4).toBeCalledTimes(1);
        expect(spy5).toBeCalledTimes(1);
      });
    });
    it("should trigger error effects", async () => {
      createRequestInterceptor(command, { status: 400 });
      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();

      const effect = createEffect(command, {
        onError: spy1,
        onSuccess: spy2,
        onFinished: spy3,
        onStart: spy4,
        onTrigger: spy5,
      });
      builder.addEffect(effect);

      command.send();

      await waitFor(() => {
        expect(spy1).toBeCalledTimes(1);
        expect(spy2).toBeCalledTimes(0);
        expect(spy3).toBeCalledTimes(1);
        expect(spy4).toBeCalledTimes(1);
        expect(spy5).toBeCalledTimes(1);
      });
    });
    it("should not throw when effects are empty", async () => {
      const effect = createEffect(command);

      expect(effect.onTrigger).not.toThrow();
      expect(effect.onStart).not.toThrow();
      expect(effect.onSuccess).not.toThrow();
      expect(effect.onError).not.toThrow();
      expect(effect.onFinished).not.toThrow();
    });
  });
});
