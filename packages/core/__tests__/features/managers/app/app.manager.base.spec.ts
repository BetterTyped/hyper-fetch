import { createHttpMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import { Client } from "client";
import { AppManager, appManagerInitialOptions, hasDocument, hasWindow, isNavigatorOnline } from "managers";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("AppManager [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    vi.resetAllMocks();
    client.appManager.unmount();
    client = new Client({ url: "shared-base-url" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      const focusSpy = vi.fn();
      const blurSpy = vi.fn();
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
      const onlineSpy = vi.fn();
      const offlineSpy = vi.fn();
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
      const focusSpy = vi.fn();
      const blurSpy = vi.fn();
      const onlineSpy = vi.fn();
      const offlineSpy = vi.fn();

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
  describe("When app manager reads the initial state", () => {
    it("should apply synchronous initial getters right away", () => {
      const manager = new AppManager({ initiallyOnline: () => false, initiallyFocused: () => false });

      expect(manager.isOnline).toBeFalse();
      expect(manager.isFocused).toBeFalse();

      const onlineManager = new AppManager({ initiallyOnline: () => true, initiallyFocused: () => true });

      expect(onlineManager.isOnline).toBeTrue();
      expect(onlineManager.isFocused).toBeTrue();
    });
    it("should await asynchronous initial getters", async () => {
      const manager = new AppManager({ initiallyOnline: async () => true, initiallyFocused: async () => true });

      expect(manager.isOnline).toBeFalse();
      expect(manager.isFocused).toBeFalse();
      await waitFor(() => {
        expect(manager.isOnline).toBeTrue();
        expect(manager.isFocused).toBeTrue();
      });
    });
    it("should start offline when the browser is offline", () => {
      vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

      expect(new AppManager().isOnline).toBeFalse();
      expect(new Client({ url: "shared-base-url" }).appManager.isOnline).toBeFalse();
    });
    it("should start online when the browser is online", () => {
      vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);

      expect(new AppManager().isOnline).toBeTrue();
    });
    it("should prefer the initiallyOnline option over the browser state", () => {
      vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

      expect(new AppManager({ initiallyOnline: true }).isOnline).toBeTrue();
    });
    it("should assume online when the browser state is unknown", () => {
      vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(undefined as unknown as boolean);
      expect(isNavigatorOnline()).toBeTrue();

      vi.spyOn(global, "navigator", "get").mockReturnValue(undefined as unknown as Navigator);
      expect(isNavigatorOnline()).toBeTrue();
    });
  });

  describe("When app manager listens to the browser events", () => {
    it("should track the window online and offline events", () => {
      const manager = new AppManager();
      const onlineSpy = vi.fn();
      const offlineSpy = vi.fn();
      manager.events.onOnline(onlineSpy);
      manager.events.onOffline(offlineSpy);
      manager.initialize();

      window.dispatchEvent(new Event("offline"));
      expect(manager.isOnline).toBeFalse();
      expect(offlineSpy).toHaveBeenCalledTimes(1);

      window.dispatchEvent(new Event("online"));
      expect(manager.isOnline).toBeTrue();
      expect(onlineSpy).toHaveBeenCalledTimes(1);
      manager.unmount();
    });
    it("should track the window focus, blur and visibility events", () => {
      const manager = new AppManager();
      const focusSpy = vi.fn();
      const blurSpy = vi.fn();
      manager.events.onFocus(focusSpy);
      manager.events.onBlur(blurSpy);
      manager.initialize();

      window.dispatchEvent(new Event("blur"));
      expect(manager.isFocused).toBeFalse();
      window.dispatchEvent(new Event("focus"));
      expect(manager.isFocused).toBeTrue();
      window.document.dispatchEvent(new Event("visibilitychange"));

      expect(blurSpy).toHaveBeenCalledTimes(1);
      expect(focusSpy).toHaveBeenCalledTimes(2);
      manager.unmount();
    });
    it("should not react to the browser events before initialization", () => {
      const manager = new AppManager();
      const offlineSpy = vi.fn();
      manager.events.onOffline(offlineSpy);

      window.dispatchEvent(new Event("offline"));

      expect(manager.isOnline).toBeTrue();
      expect(offlineSpy).not.toHaveBeenCalled();
      window.dispatchEvent(new Event("online"));
    });
    it("should remove the browser listeners on unmount and keep the event subscriptions", () => {
      const manager = new AppManager();
      const offlineSpy = vi.fn();
      manager.events.onOffline(offlineSpy);
      manager.initialize();
      manager.unmount();

      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("blur"));

      expect(manager.isOnline).toBeTrue();
      expect(manager.isFocused).toBeTrue();
      expect(offlineSpy).not.toHaveBeenCalled();

      manager.setOnline(false);
      expect(offlineSpy).toHaveBeenCalledTimes(1);
      window.dispatchEvent(new Event("online"));
      window.dispatchEvent(new Event("focus"));
    });
    it("should not register the browser listeners twice when initialized again", () => {
      const manager = new AppManager();
      const offlineSpy = vi.fn();
      manager.events.onOffline(offlineSpy);
      manager.initialize();
      manager.initialize();

      window.dispatchEvent(new Event("offline"));

      expect(offlineSpy).toHaveBeenCalledTimes(1);
      manager.unmount();
      window.dispatchEvent(new Event("online"));
    });
    it("should allow to initialize again after unmount", () => {
      const manager = new AppManager();
      manager.initialize();
      manager.unmount();
      manager.initialize();

      window.dispatchEvent(new Event("offline"));
      expect(manager.isOnline).toBeFalse();
      window.dispatchEvent(new Event("online"));
      expect(manager.isOnline).toBeTrue();
      manager.unmount();
    });
    it("should call the cleanup functions returned by custom handlers", () => {
      const unmountFocus = vi.fn();
      const unmountOnline = vi.fn();
      const manager = new AppManager({ focusEvent: () => unmountFocus, onlineEvent: () => unmountOnline });

      manager.unmount();
      expect(unmountFocus).not.toHaveBeenCalled();

      manager.initialize();
      expect(unmountFocus).not.toHaveBeenCalled();
      expect(unmountOnline).not.toHaveBeenCalled();

      manager.unmount();
      manager.unmount();
      expect(unmountFocus).toHaveBeenCalledTimes(1);
      expect(unmountOnline).toHaveBeenCalledTimes(1);
    });
    it("should clean up the previous custom subscription when initialized again", () => {
      const unmountOnline = vi.fn();
      const onlineEvent = vi.fn().mockReturnValue(unmountOnline);
      const manager = new AppManager({ onlineEvent, focusEvent: () => {} });

      manager.initialize();
      manager.initialize();

      expect(onlineEvent).toHaveBeenCalledTimes(2);
      expect(unmountOnline).toHaveBeenCalledTimes(1);
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
      const focusSpy = vi.fn();
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
      const onlineSpy = vi.fn();
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
      const focusSpy = vi.fn();
      const blurSpy = vi.fn();

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
      const focusSpy = vi.fn();
      const onlineSpy = vi.fn();

      vi.spyOn(appManagerInitialOptions, "focusEvent").mockImplementation(focusSpy);
      vi.spyOn(appManagerInitialOptions, "onlineEvent").mockImplementation(onlineSpy);

      // eslint-disable-next-line no-new
      new AppManager().initialize();

      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(onlineSpy).toHaveBeenCalledTimes(1);
    });
    it("should use one default event handlers when not specified", async () => {
      const focusSpy = vi.fn();
      const onlineSpy = vi.fn();

      vi.spyOn(appManagerInitialOptions, "onlineEvent").mockImplementation(onlineSpy);

      // eslint-disable-next-line no-new
      new AppManager({ focusEvent: focusSpy }).initialize();

      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(onlineSpy).toHaveBeenCalledTimes(1);
    });
    it("should use other default event handlers when not specified", async () => {
      const focusSpy = vi.fn();
      const onlineSpy = vi.fn();

      vi.spyOn(appManagerInitialOptions, "focusEvent").mockImplementation(focusSpy);

      // eslint-disable-next-line no-new
      new AppManager({ onlineEvent: onlineSpy }).initialize();

      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(onlineSpy).toHaveBeenCalledTimes(1);
    });
  });
});
