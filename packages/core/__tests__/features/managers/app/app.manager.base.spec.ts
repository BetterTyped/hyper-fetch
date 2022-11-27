import { waitFor } from "@testing-library/dom";

import { AppManager, hasDocument, hasWindow } from "managers";
import { createBuilder } from "../../../utils";
import { resetInterceptors, startServer, stopServer } from "../../../server";

describe("AppManager [ Base ]", () => {
  let builder = createBuilder();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    builder = createBuilder();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When app manager is initialized", () => {
    it("should initialize with isFocused set to true", async () => {
      expect(builder.appManager.isFocused).toBeTrue();
    });
    it("should initialize with isOnline set to true", async () => {
      expect(builder.appManager.isOnline).toBeTrue();
    });
    it("should initialize with custom isFocused", async () => {
      const firstManager = new AppManager({ initiallyFocused: false });
      const secondManager = new AppManager({ initiallyFocused: async () => false });
      const thirdManager = new AppManager({ initiallyFocused: undefined });

      await waitFor(() => {
        expect(firstManager.isFocused).toBeFalse();
        expect(secondManager.isFocused).toBeFalse();
        expect(thirdManager.isFocused).toBeTrue();
      });
    });
    it("should initialize with custom isOnline", async () => {
      const firstManager = new AppManager({ initiallyOnline: false });
      const secondManager = new AppManager({ initiallyOnline: async () => false });
      const thirdManager = new AppManager({ initiallyOnline: undefined });

      await waitFor(() => {
        expect(firstManager.isOnline).toBeFalse();
        expect(secondManager.isOnline).toBeFalse();
        expect(thirdManager.isOnline).toBeTrue();
      });
    });
  });
  describe("When using app manager methods", () => {
    it("should allow to change app focus state", async () => {
      const focusSpy = jest.fn();
      const blurSpy = jest.fn();
      builder.appManager.events.onFocus(focusSpy);
      builder.appManager.events.onBlur(blurSpy);
      builder.appManager.setFocused(false);
      expect(builder.appManager.isFocused).toBeFalse();
      builder.appManager.setFocused(true);
      expect(builder.appManager.isFocused).toBeTrue();

      expect(focusSpy).toBeCalledTimes(1);
      expect(blurSpy).toBeCalledTimes(1);
    });
    it("should allow to change app online state", async () => {
      const onlineSpy = jest.fn();
      const offlineSpy = jest.fn();
      builder.appManager.events.onOnline(onlineSpy);
      builder.appManager.events.onOffline(offlineSpy);
      builder.appManager.setOnline(false);
      expect(builder.appManager.isOnline).toBeFalse();
      builder.appManager.setOnline(true);
      expect(builder.appManager.isOnline).toBeTrue();

      expect(onlineSpy).toBeCalledTimes(1);
      expect(offlineSpy).toBeCalledTimes(1);
    });
  });
  describe("When using app manager utils", () => {
    it("should allow to detect window", async () => {
      expect(hasWindow()).toBeTrue();
    });
    it("should allow to detect document", async () => {
      expect(hasDocument()).toBeTrue();
    });
  });
});
