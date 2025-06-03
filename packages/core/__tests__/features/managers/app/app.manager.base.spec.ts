import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { AppManager, appManagerInitialOptions, hasDocument, hasWindow } from "managers";
import { Client } from "client";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("AppManager [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    jest.resetAllMocks();
    client = new Client({ url: "shared-base-url" });
  });

  afterAll(() => {
    stopServer();
  });

  describe("When app manager is initialized", () => {
    it("should initialize with isFocused set to true", async () => {
      expect(client.appManager.isFocused).toBeTrue();
    });
    it("should initialize with isOnline set to true", async () => {
      expect(client.appManager.isOnline).toBeTrue();
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
      client.appManager.events.onFocus(focusSpy);
      client.appManager.events.onBlur(blurSpy);
      client.appManager.setFocused(false);
      expect(client.appManager.isFocused).toBeFalse();
      client.appManager.setFocused(true);
      expect(client.appManager.isFocused).toBeTrue();

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(blurSpy).toHaveBeenCalledTimes(1);
    });
    it("should allow to change app online state", async () => {
      const onlineSpy = jest.fn();
      const offlineSpy = jest.fn();
      client.appManager.events.onOnline(onlineSpy);
      client.appManager.events.onOffline(offlineSpy);
      client.appManager.setOnline(false);
      expect(client.appManager.isOnline).toBeFalse();
      client.appManager.setOnline(true);
      expect(client.appManager.isOnline).toBeTrue();

      expect(onlineSpy).toHaveBeenCalledTimes(1);
      expect(offlineSpy).toHaveBeenCalledTimes(1);
    });
    it("should properly cleanup event listeners when unmount functions are called", async () => {
      const focusSpy = jest.fn();
      const blurSpy = jest.fn();
      const onlineSpy = jest.fn();
      const offlineSpy = jest.fn();

      // Setup listeners and store cleanup functions
      const cleanupFocus = client.appManager.events.onFocus(focusSpy);
      const cleanupBlur = client.appManager.events.onBlur(blurSpy);
      const cleanupOnline = client.appManager.events.onOnline(onlineSpy);
      const cleanupOffline = client.appManager.events.onOffline(offlineSpy);

      // Trigger events once - all should fire
      client.appManager.setFocused(false);
      client.appManager.setFocused(true);
      client.appManager.setOnline(false);
      client.appManager.setOnline(true);

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(blurSpy).toHaveBeenCalledTimes(1);
      expect(onlineSpy).toHaveBeenCalledTimes(1);
      expect(offlineSpy).toHaveBeenCalledTimes(1);

      // Clean up all listeners
      cleanupFocus();
      cleanupBlur();
      cleanupOnline();
      cleanupOffline();

      // Trigger events again - none should fire
      client.appManager.setFocused(false);
      client.appManager.setFocused(true);
      client.appManager.setOnline(false);
      client.appManager.setOnline(true);

      // Counts should remain the same
      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(blurSpy).toHaveBeenCalledTimes(1);
      expect(onlineSpy).toHaveBeenCalledTimes(1);
      expect(offlineSpy).toHaveBeenCalledTimes(1);
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
  describe("When app manager is initialized with custom events", () => {
    it("should use custom focus event handler", async () => {
      const focusSpy = jest.fn();
      const customFocusHandler = (setFocused: (isFocused: boolean) => void) => {
        // Custom focus handler implementation
        setFocused(true);
      };

      const manager = new AppManager({ focusEvent: customFocusHandler });
      manager.events.onFocus(focusSpy);

      // Trigger the custom focus handler
      customFocusHandler(manager.setFocused);
      expect(focusSpy).toHaveBeenCalledTimes(1);
    });

    it("should use custom online event handler", async () => {
      const onlineSpy = jest.fn();
      const customOnlineHandler = (setOnline: (isOnline: boolean) => void) => {
        // Custom online handler implementation
        setOnline(true);
      };

      const manager = new AppManager({ onlineEvent: customOnlineHandler });
      manager.events.onOnline(onlineSpy);

      // Trigger the custom online handler
      customOnlineHandler(manager.setOnline);
      expect(onlineSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle state changes with custom handlers", async () => {
      const focusSpy = jest.fn();
      const blurSpy = jest.fn();

      const customFocusHandler = (setFocused: (isFocused: boolean) => void) => {
        // Test both focus and blur
        setFocused(false);
        setFocused(true);
      };

      const manager = new AppManager({ focusEvent: customFocusHandler });
      manager.events.onFocus(focusSpy);
      manager.events.onBlur(blurSpy);

      // Trigger the custom focus handler
      customFocusHandler(manager.setFocused);

      expect(blurSpy).toHaveBeenCalledTimes(1);
      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(manager.isFocused).toBeTrue();
    });
  });

  describe("When using app manager initial options", () => {
    it("should use default event handlers when not specified", async () => {
      const focusSpy = jest.fn();
      const onlineSpy = jest.fn();

      jest.spyOn(appManagerInitialOptions, "focusEvent").mockImplementation(focusSpy);
      jest.spyOn(appManagerInitialOptions, "onlineEvent").mockImplementation(onlineSpy);

      // eslint-disable-next-line no-new
      new AppManager().initialize();

      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(onlineSpy).toHaveBeenCalledTimes(1);
    });
    it("should use one default event handlers when not specified", async () => {
      const focusSpy = jest.fn();
      const onlineSpy = jest.fn();

      jest.spyOn(appManagerInitialOptions, "onlineEvent").mockImplementation(onlineSpy);

      // eslint-disable-next-line no-new
      new AppManager({ focusEvent: focusSpy }).initialize();

      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(onlineSpy).toHaveBeenCalledTimes(1);
    });
    it("should use other default event handlers when not specified", async () => {
      const focusSpy = jest.fn();
      const onlineSpy = jest.fn();

      jest.spyOn(appManagerInitialOptions, "focusEvent").mockImplementation(focusSpy);

      // eslint-disable-next-line no-new
      new AppManager({ onlineEvent: onlineSpy }).initialize();

      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(onlineSpy).toHaveBeenCalledTimes(1);
    });
  });
});
