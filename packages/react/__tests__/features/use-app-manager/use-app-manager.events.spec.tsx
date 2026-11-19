import { AppManager, Client } from "@hyper-fetch/core";
import { act, render, renderHook, screen } from "@testing-library/react";
import type { UseAppManagerReturnType } from "hooks/use-app-manager";
import { useAppManager } from "hooks/use-app-manager";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { expectTypeOf } from "vitest";

const createClient = (options?: { initiallyOnline?: boolean; initiallyFocused?: boolean }) => {
  return new Client({
    url: "http://app-manager",
    appManager: () =>
      new AppManager({
        initiallyOnline: options?.initiallyOnline ?? true,
        initiallyFocused: options?.initiallyFocused ?? true,
      }),
  });
};

const countListeners = (client: Client) => {
  const { emitter } = client.appManager;
  return emitter.eventNames().reduce((sum, name) => sum + emitter.listenerCount(name), 0);
};

describe("useAppManager [ Events ]", () => {
  describe("when the hook mounts", () => {
    it("should read the online and focused state of the client", () => {
      const client = createClient();
      const { result } = renderHook(() => useAppManager(client));

      expect(result.current.isOnline).toBeTrue();
      expect(result.current.isFocused).toBeTrue();
    });
    it("should start offline when the client is offline", () => {
      const client = createClient({ initiallyOnline: false });
      const { result } = renderHook(() => useAppManager(client));

      expect(result.current.isOnline).toBeFalse();
      expect(result.current.isFocused).toBeTrue();
    });
    it("should start blurred when the client is not focused", () => {
      const client = createClient({ initiallyFocused: false });
      const { result } = renderHook(() => useAppManager(client));

      expect(result.current.isFocused).toBeFalse();
      expect(result.current.isOnline).toBeTrue();
    });
    it("should show the right state on the very first render", () => {
      const client = createClient({ initiallyOnline: false, initiallyFocused: false });
      const renders: string[] = [];

      renderHook(() => {
        const state = useAppManager(client);
        renders.push(`${state.isOnline}:${state.isFocused}`);
        return state;
      });

      expect(renders[0]).toBe("false:false");
    });
    it("should read the state changed before the mount", () => {
      const client = createClient();
      client.appManager.setOnline(false);
      client.appManager.setFocused(false);

      const { result } = renderHook(() => useAppManager(client));

      expect(result.current.isOnline).toBeFalse();
      expect(result.current.isFocused).toBeFalse();
    });
  });

  describe("when the app manager emits events", () => {
    it("should follow the offline and online events", () => {
      const client = createClient();
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        client.appManager.setOnline(false);
      });
      expect(result.current.isOnline).toBeFalse();

      act(() => {
        client.appManager.setOnline(true);
      });
      expect(result.current.isOnline).toBeTrue();
    });
    it("should follow the blur and focus events", () => {
      const client = createClient();
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        client.appManager.setFocused(false);
      });
      expect(result.current.isFocused).toBeFalse();

      act(() => {
        client.appManager.setFocused(true);
      });
      expect(result.current.isFocused).toBeTrue();
    });
    it("should keep the online and focused state apart", () => {
      const client = createClient();
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        client.appManager.setOnline(false);
      });
      expect(result.current.isFocused).toBeTrue();

      act(() => {
        client.appManager.setFocused(false);
        client.appManager.setOnline(true);
      });
      expect(result.current.isOnline).toBeTrue();
      expect(result.current.isFocused).toBeFalse();
    });
    it("should end with the last of many quick changes", () => {
      const client = createClient();
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        for (let i = 0; i < 25; i += 1) {
          client.appManager.setOnline(i % 2 === 0);
          client.appManager.setFocused(i % 2 === 1);
        }
      });

      expect(result.current.isOnline).toBeTrue();
      expect(result.current.isFocused).toBeFalse();
    });
    it("should not rerender when an event repeats the current state", () => {
      const client = createClient();
      let renders = 0;
      renderHook(() => {
        renders += 1;
        return useAppManager(client);
      });
      const rendersAfterMount = renders;

      act(() => {
        client.appManager.setOnline(true);
        client.appManager.setFocused(true);
      });

      expect(renders).toBe(rendersAfterMount);
    });
    it("should follow the online and offline events of the window", () => {
      const client = new Client({ url: "http://app-manager" });
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });
      expect(result.current.isOnline).toBeFalse();

      act(() => {
        window.dispatchEvent(new Event("online"));
      });
      expect(result.current.isOnline).toBeTrue();
      client.appManager.unmount();
    });
    it("should follow the blur and focus events of the window", () => {
      const client = new Client({ url: "http://app-manager" });
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        window.dispatchEvent(new Event("blur"));
      });
      expect(result.current.isFocused).toBeFalse();

      act(() => {
        window.dispatchEvent(new Event("focus"));
      });
      expect(result.current.isFocused).toBeTrue();
      client.appManager.unmount();
    });
  });

  describe("when using the setters", () => {
    it("should change the online state of the client", () => {
      const client = createClient();
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        result.current.setOnline(false);
      });

      expect(result.current.isOnline).toBeFalse();
      expect(client.appManager.isOnline).toBeFalse();
    });
    it("should change the focused state of the client", () => {
      const client = createClient();
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        result.current.setFocused(false);
      });

      expect(result.current.isFocused).toBeFalse();
      expect(client.appManager.isFocused).toBeFalse();
    });
    it("should bring the state back", () => {
      const client = createClient({ initiallyOnline: false, initiallyFocused: false });
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        result.current.setOnline(true);
        result.current.setFocused(true);
      });

      expect(result.current.isOnline).toBeTrue();
      expect(result.current.isFocused).toBeTrue();
    });
    it("should notify the other listeners of the app manager", () => {
      const client = createClient();
      const onOffline = vi.fn();
      const onBlur = vi.fn();
      client.appManager.events.onOffline(onOffline);
      client.appManager.events.onBlur(onBlur);
      const { result } = renderHook(() => useAppManager(client));

      act(() => {
        result.current.setOnline(false);
        result.current.setFocused(false);
      });

      expect(onOffline).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
    it("should update every hook using the same client", () => {
      const client = createClient();
      const first = renderHook(() => useAppManager(client));
      const second = renderHook(() => useAppManager(client));

      act(() => {
        first.result.current.setOnline(false);
        second.result.current.setFocused(false);
      });

      expect(first.result.current.isOnline).toBeFalse();
      expect(second.result.current.isOnline).toBeFalse();
      expect(first.result.current.isFocused).toBeFalse();
      expect(second.result.current.isFocused).toBeFalse();
    });
    it("should not touch the hooks of another client", () => {
      const client = createClient();
      const otherClient = createClient();
      const view = renderHook(() => useAppManager(client));
      const other = renderHook(() => useAppManager(otherClient));

      act(() => {
        view.result.current.setOnline(false);
      });

      expect(other.result.current.isOnline).toBeTrue();
      expect(otherClient.appManager.isOnline).toBeTrue();
    });
    it("should update a component from a button click", () => {
      const client = createClient();
      function Status() {
        const { isOnline, setOnline } = useAppManager(client);
        return (
          <button type="button" onClick={() => setOnline(!isOnline)}>
            {isOnline ? "online" : "offline"}
          </button>
        );
      }
      render(<Status />);

      act(() => {
        screen.getByRole("button").click();
      });
      expect(screen.getByRole("button").textContent).toBe("offline");

      act(() => {
        screen.getByRole("button").click();
      });
      expect(screen.getByRole("button").textContent).toBe("online");
    });
  });

  describe("when the client changes", () => {
    it("should show the state of the new client", () => {
      const client = createClient();
      const offlineClient = createClient({ initiallyOnline: false, initiallyFocused: false });
      const { result, rerender } = renderHook(({ current }: { current: Client }) => useAppManager(current), {
        initialProps: { current: client },
      });

      rerender({ current: offlineClient });

      expect(result.current.isOnline).toBeFalse();
      expect(result.current.isFocused).toBeFalse();
    });
    it("should follow the events of the new client only", () => {
      const client = createClient();
      const nextClient = createClient();
      const { result, rerender } = renderHook(({ current }: { current: Client }) => useAppManager(current), {
        initialProps: { current: client },
      });
      rerender({ current: nextClient });

      act(() => {
        client.appManager.setOnline(false);
      });
      expect(result.current.isOnline).toBeTrue();

      act(() => {
        nextClient.appManager.setFocused(false);
      });
      expect(result.current.isFocused).toBeFalse();
    });
    it("should use the setters of the new client", () => {
      const client = createClient();
      const nextClient = createClient();
      const { result, rerender } = renderHook(({ current }: { current: Client }) => useAppManager(current), {
        initialProps: { current: client },
      });
      rerender({ current: nextClient });

      act(() => {
        result.current.setOnline(false);
      });

      expect(nextClient.appManager.isOnline).toBeFalse();
      expect(client.appManager.isOnline).toBeTrue();
    });
    it("should remove the listeners from the previous client", () => {
      const client = createClient();
      const nextClient = createClient();
      const baseline = countListeners(client);
      const { rerender } = renderHook(({ current }: { current: Client }) => useAppManager(current), {
        initialProps: { current: client },
      });

      rerender({ current: nextClient });

      expect(countListeners(client)).toBe(baseline);
    });
  });

  describe("when the hook unmounts", () => {
    it("should remove every listener", () => {
      const client = createClient();
      const baseline = countListeners(client);
      const { unmount } = renderHook(() => useAppManager(client));
      expect(countListeners(client)).toBe(baseline + 4);

      unmount();

      expect(countListeners(client)).toBe(baseline);
    });
    it("should not update or warn after the unmount", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => null);
      const client = createClient();
      const { result, unmount } = renderHook(() => useAppManager(client));

      unmount();
      client.appManager.setOnline(false);
      client.appManager.setFocused(false);

      expect(result.current.isOnline).toBeTrue();
      expect(result.current.isFocused).toBeTrue();
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
    it("should keep the other hooks subscribed", () => {
      const client = createClient();
      const first = renderHook(() => useAppManager(client));
      const second = renderHook(() => useAppManager(client));

      first.unmount();
      act(() => {
        client.appManager.setOnline(false);
      });

      expect(second.result.current.isOnline).toBeFalse();
    });
    it("should read the current state when mounted again", () => {
      const client = createClient();
      const first = renderHook(() => useAppManager(client));
      first.unmount();
      client.appManager.setOnline(false);

      const second = renderHook(() => useAppManager(client));

      expect(second.result.current.isOnline).toBeFalse();
    });
    it("should not add listeners over many rerenders", () => {
      const client = createClient();
      const { rerender } = renderHook(() => useAppManager(client));
      const mounted = countListeners(client);

      for (let i = 0; i < 10; i += 1) {
        rerender();
      }
      act(() => {
        client.appManager.setOnline(false);
        client.appManager.setOnline(true);
      });

      expect(countListeners(client)).toBe(mounted);
    });
  });

  describe("when rendered in StrictMode", () => {
    it("should follow the events after the double mount", () => {
      const client = createClient();
      const { result } = renderHook(() => useAppManager(client), { wrapper: StrictMode });

      act(() => {
        client.appManager.setOnline(false);
        client.appManager.setFocused(false);
      });

      expect(result.current.isOnline).toBeFalse();
      expect(result.current.isFocused).toBeFalse();
    });
    it("should subscribe once", () => {
      const client = createClient();
      const baseline = countListeners(client);

      renderHook(() => useAppManager(client), { wrapper: StrictMode });

      expect(countListeners(client)).toBe(baseline + 4);
    });
    it("should remove every listener on unmount", () => {
      const client = createClient();
      const baseline = countListeners(client);
      const { unmount } = renderHook(() => useAppManager(client), { wrapper: StrictMode });

      unmount();

      expect(countListeners(client)).toBe(baseline);
    });
  });

  describe("when rendered on the server", () => {
    function Status({ client }: { client: Client }) {
      const { isOnline, isFocused } = useAppManager(client);
      return (
        <p>
          {isOnline ? "online" : "offline"}-{isFocused ? "focused" : "blurred"}
        </p>
      );
    }

    it("should render the state of the client to a string", () => {
      const client = createClient();

      expect(renderToString(<Status client={client} />)).toContain("online");
      expect(renderToString(<Status client={client} />)).toContain("focused");
    });
    it("should render the offline state to a string", () => {
      const client = createClient({ initiallyOnline: false, initiallyFocused: false });
      const html = renderToString(<Status client={client} />);

      expect(html).toContain("offline");
      expect(html).toContain("blurred");
    });
    it("should not subscribe during the server render", () => {
      const client = createClient();
      const baseline = countListeners(client);

      renderToString(<Status client={client} />);

      expect(countListeners(client)).toBe(baseline);
    });
    it("should render without a window", () => {
      const client = createClient();
      const noWindow: unknown = undefined;
      vi.stubGlobal("window", noWindow);

      let html = "";
      try {
        html = renderToString(<Status client={client} />);
      } finally {
        vi.unstubAllGlobals();
      }

      expect(html).toContain("online");
    });
  });

  describe("types", () => {
    it("should type the returned state and setters", () => {
      expectTypeOf<UseAppManagerReturnType["isOnline"]>().toEqualTypeOf<boolean>();
      expectTypeOf<UseAppManagerReturnType["isFocused"]>().toEqualTypeOf<boolean>();
      expectTypeOf<UseAppManagerReturnType["setOnline"]>().toEqualTypeOf<(isOnline: boolean) => void>();
      expectTypeOf<UseAppManagerReturnType["setFocused"]>().toEqualTypeOf<(isFocused: boolean) => void>();
    });
    it("should accept any client", () => {
      expectTypeOf(useAppManager).toBeCallableWith(createClient());
      expectTypeOf(useAppManager).returns.toEqualTypeOf<UseAppManagerReturnType>();
    });
  });
});
