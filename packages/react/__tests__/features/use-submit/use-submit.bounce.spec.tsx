import type { ExtractAdapterResolvedType, RequestInstance } from "@hyper-fetch/core";
import { act, renderHook } from "@testing-library/react";
import type { UseSubmitOptionsType } from "hooks/use-submit";
import { useSubmit } from "hooks/use-submit";
import { StrictMode } from "react";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = () => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: "/users",
    method: "POST",
  });
  return { ...gated, request };
};

const debounce = { bounce: true, bounceType: "debounce", bounceTime: 400 } as const;
const throttle = { bounce: true, bounceType: "throttle", bounceTime: 400, bounceTimeout: 400 } as const;

/** The tests read the state outside of the render, so the hook has to rerender on every change */
const useUntrackedSubmit = <T extends RequestInstance>(request: T, options?: UseSubmitOptionsType<T>) =>
  useSubmit(request, { dependencyTracking: false, ...options } as UseSubmitOptionsType<T>);

/** Run the pending timers and promise callbacks */
const advance = async (time = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(time);
  });
};

/** Collects the responses of the submit calls in the order they got resolved */
const createCollector = <T extends RequestInstance>() => {
  const responses: { label: string; response: ExtractAdapterResolvedType<T> }[] = [];
  const collect = (label: string) => (response: ExtractAdapterResolvedType<T>) => {
    responses.push({ label, response });
  };
  return { responses, collect };
};

describe("useSubmit [ Bounce ]", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given the bounce is off", () => {
    it("should send every submit right away", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });
      await advance();

      expect(calls).toHaveLength(2);
      expect(result.current.bounce.active).toBeFalse();
    });
  });

  describe("given the submits are debounced", () => {
    it("should not send the request before the bounce time passes", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance(399);

      expect(calls).toHaveLength(0);
      expect(result.current.submitting).toBeFalse();
    });
    it("should send the request once the bounce time passes", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance(400);

      expect(calls).toHaveLength(1);
      expect(calls[0].request.payload).toStrictEqual({ name: "Maciej" });
      expect(result.current.submitting).toBeTrue();
    });
    it("should use the default bounce time of 400ms", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, { bounce: true }));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance(399);
      expect(calls).toHaveLength(0);

      await advance(1);
      expect(calls).toHaveLength(1);
    });
    it("should send only the last of the submits made within the bounce time", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
        result.current.submit({ payload: { name: "Third" } });
      });
      await advance(400);

      expect(calls).toHaveLength(1);
      expect(calls[0].request.payload).toStrictEqual({ name: "Third" });
    });
    it("should restart the bounce time with every submit", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));

      for (let index = 0; index < 5; index += 1) {
        act(() => {
          result.current.submit({ payload: { name: `Call ${index}` } });
        });
        // eslint-disable-next-line no-await-in-loop
        await advance(300);
      }
      expect(calls).toHaveLength(0);

      await advance(100);
      expect(calls).toHaveLength(1);
      expect(calls[0].request.payload).toStrictEqual({ name: "Call 4" });
    });
    it("should resolve every submit of the batch with the response of the sent request", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));
      const { responses, collect } = createCollector<typeof request>();

      act(() => {
        result.current.submit({ payload: { name: "First" } }).then(collect("first"));
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
        result.current.submit({ payload: { name: "Third" } }).then(collect("third"));
      });
      await advance(400);
      expect(responses).toHaveLength(0);

      calls[0].succeed({ id: 3, name: "Third" });
      await advance();

      expect(responses.map((item) => item.label)).toStrictEqual(["first", "second", "third"]);
      expect(responses.map((item) => item.response.data)).toStrictEqual([
        { id: 3, name: "Third" },
        { id: 3, name: "Third" },
        { id: 3, name: "Third" },
      ]);
    });
    it("should resolve every submit of the batch with the error of the sent request", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));
      const { responses, collect } = createCollector<typeof request>();

      act(() => {
        result.current.submit({ payload: { name: "First" } }).then(collect("first"));
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
      });
      await advance(400);
      calls[0].fail({ message: "Nope" }, 400);
      await advance();

      expect(responses.map((item) => item.response.error)).toStrictEqual([{ message: "Nope" }, { message: "Nope" }]);
      expect(responses.map((item) => item.response.success)).toStrictEqual([false, false]);
    });
    it("should send a new request for the submits made after the bounce time", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));
      const { responses, collect } = createCollector<typeof request>();

      act(() => {
        result.current.submit({ payload: { name: "First" } }).then(collect("first"));
      });
      await advance(400);
      act(() => {
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
      });
      await advance(400);
      expect(calls).toHaveLength(2);

      calls[0].succeed({ id: 1, name: "First" });
      calls[1].succeed({ id: 2, name: "Second" });
      await advance();

      expect(responses.map((item) => [item.label, item.response.data?.name])).toStrictEqual([
        ["first", "First"],
        ["second", "Second"],
      ]);
    });
    it("should report the active bounce until the request is sent", async () => {
      const { request } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));
      expect(result.current.bounce.active).toBeFalse();

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      expect(result.current.bounce.active).toBeTrue();

      await advance(400);
      expect(result.current.bounce.active).toBeFalse();
    });
    it("should call the callbacks once for the batch", async () => {
      const { request, calls } = setup();
      const success = vi.fn();
      const requestStart = vi.fn();
      const { result } = renderHook(() => {
        const view = useUntrackedSubmit(request, debounce);
        view.onSubmitSuccess(success);
        view.onSubmitRequestStart(requestStart);
        return view;
      });

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });
      await advance(400);
      calls[0].succeed({ id: 2, name: "Second" });
      await advance();

      expect(requestStart).toHaveBeenCalledTimes(1);
      expect(success).toHaveBeenCalledTimes(1);
    });
    it("should run the optimistic callback once, when the request is sent", async () => {
      const { request, calls } = setup();
      const optimistic = vi.fn(() => ({ context: { applied: true } }));
      const { result } = renderHook(() => useUntrackedSubmit(request.setOptimistic(optimistic), debounce));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });
      await advance(399);
      expect(optimistic).not.toHaveBeenCalled();

      await advance(1);
      expect(optimistic).toHaveBeenCalledTimes(1);
      expect(calls).toHaveLength(1);
    });
    it("should follow the bounce time changed on rerender", async () => {
      const { request, calls } = setup();
      const { result, rerender } = renderHook(
        ({ bounceTime }: { bounceTime: number }) => useUntrackedSubmit(request, { bounce: true, bounceTime }),
        { initialProps: { bounceTime: 400 } },
      );

      rerender({ bounceTime: 1000 });
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance(999);
      expect(calls).toHaveLength(0);

      await advance(1);
      expect(calls).toHaveLength(1);
    });
    it("should not start the bounce when the hook is disabled", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, { ...debounce, disabled: true }));
      const { responses, collect } = createCollector<typeof request>();

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } }).then(collect("disabled"));
      });
      await advance(400);

      expect(calls).toHaveLength(0);
      expect(responses).toHaveLength(1);
      expect(responses[0].response.success).toBeFalse();
      expect(result.current.bounce.active).toBeFalse();
    });
    it("should work in StrictMode", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce), { wrapper: StrictMode });
      const { responses, collect } = createCollector<typeof request>();

      act(() => {
        result.current.submit({ payload: { name: "First" } }).then(collect("first"));
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
      });
      await advance(400);
      expect(calls).toHaveLength(1);
      calls[0].succeed({ id: 2, name: "Second" });
      await advance();

      expect(responses.map((item) => item.response.data?.name)).toStrictEqual(["Second", "Second"]);
    });
  });

  describe("given the debounced submit gets reset", () => {
    it("should not send the request", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });

      act(() => {
        result.current.bounce.reset();
      });
      await advance(1000);

      expect(calls).toHaveLength(0);
    });
    it("should resolve the waiting submits with an error response", async () => {
      const { request } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));
      const { responses, collect } = createCollector<typeof request>();
      act(() => {
        result.current.submit({ payload: { name: "First" } }).then(collect("first"));
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
      });

      act(() => {
        result.current.bounce.reset();
      });
      await advance();

      expect(responses.map((item) => item.label)).toStrictEqual(["first", "second"]);
      expect(responses[0].response).toStrictEqual({
        data: null,
        error: expect.any(Error),
        status: null,
        success: false,
        extra: request.client.adapter.defaultExtra,
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      });
    });
    it("should report the bounce as not active anymore", async () => {
      const { request } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      expect(result.current.bounce.active).toBeTrue();

      act(() => {
        result.current.bounce.reset();
      });

      expect(result.current.bounce.active).toBeFalse();
    });
    it("should send the submits made after the reset", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));
      const { responses, collect } = createCollector<typeof request>();
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      act(() => {
        result.current.bounce.reset();
      });

      act(() => {
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
      });
      await advance(400);
      calls[0].succeed({ id: 2, name: "Second" });
      await advance();

      expect(calls).toHaveLength(1);
      expect(calls[0].request.payload).toStrictEqual({ name: "Second" });
      expect(responses[0].response.data).toStrictEqual({ id: 2, name: "Second" });
    });
    it("should do nothing when there is no submit waiting", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, debounce));

      act(() => {
        result.current.bounce.reset();
      });
      await advance(1000);

      expect(calls).toHaveLength(0);
      expect(result.current.bounce.active).toBeFalse();
    });
  });

  describe("given the hook unmounts during the bounce time", () => {
    it("should not send the debounced request", async () => {
      const { request, calls } = setup();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(request, debounce));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });

      unmount();
      await advance(1000);

      expect(calls).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
    });
    it("should resolve the waiting debounced submits with an error response", async () => {
      const { request } = setup();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(request, debounce));
      const { responses, collect } = createCollector<typeof request>();
      act(() => {
        result.current.submit({ payload: { name: "First" } }).then(collect("first"));
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
      });

      unmount();
      await advance();

      expect(responses.map((item) => item.label)).toStrictEqual(["first", "second"]);
      expect(responses.map((item) => item.response.success)).toStrictEqual([false, false]);
      expect(responses[0].response.error).toBeInstanceOf(Error);
      expect(responses[0].response.data).toBeNull();
    });
    it("should not send the trailing throttled request", async () => {
      const { request, calls } = setup();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(request, throttle));
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });
      await advance();
      expect(calls).toHaveLength(1);

      unmount();
      await advance(1000);

      expect(calls).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    });
    it("should resolve the waiting throttled submits with an error response", async () => {
      const { request } = setup();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(request, throttle));
      const { responses, collect } = createCollector<typeof request>();
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
      });

      unmount();
      await advance();

      expect(responses.map((item) => item.label)).toStrictEqual(["second"]);
      expect(responses[0].response.success).toBeFalse();
    });
    it("should keep the already sent request running", async () => {
      const { request, calls } = setup();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(request, debounce));
      const { responses, collect } = createCollector<typeof request>();
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } }).then(collect("sent"));
      });
      await advance(400);

      unmount();
      calls[0].succeed({ id: 1, name: "Maciej" });
      await advance();

      expect(calls[0].aborted).toBeFalse();
      expect(responses[0].response.data).toStrictEqual({ id: 1, name: "Maciej" });
    });
  });

  describe("given the submits are throttled", () => {
    it("should send the first submit right away", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, throttle));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      await advance();

      expect(calls).toHaveLength(1);
      expect(calls[0].request.payload).toStrictEqual({ name: "First" });
    });
    it("should hold the submits made within the interval", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, throttle));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
        result.current.submit({ payload: { name: "Third" } });
      });
      await advance(399);

      expect(calls).toHaveLength(1);
    });
    it("should send the last held submit after the timeout", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, throttle));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
        result.current.submit({ payload: { name: "Third" } });
      });
      await advance(400);

      expect(calls).toHaveLength(2);
      expect(calls[1].request.payload).toStrictEqual({ name: "Third" });
    });
    it("should resolve the first submit with its own response and the held ones with the trailing response", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, throttle));
      const { responses, collect } = createCollector<typeof request>();

      act(() => {
        result.current.submit({ payload: { name: "First" } }).then(collect("first"));
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
        result.current.submit({ payload: { name: "Third" } }).then(collect("third"));
      });
      await advance(400);
      calls[0].succeed({ id: 1, name: "First" });
      await advance();
      calls[1].succeed({ id: 3, name: "Third" });
      await advance();

      expect(responses.map((item) => [item.label, item.response.data?.name])).toStrictEqual([
        ["first", "First"],
        ["second", "Third"],
        ["third", "Third"],
      ]);
    });
    it("should send a submit right away again once the interval passed", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, throttle));
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      await advance(400);

      act(() => {
        result.current.submit({ payload: { name: "Second" } });
      });
      await advance();

      expect(calls).toHaveLength(2);
      expect(calls[1].request.payload).toStrictEqual({ name: "Second" });
    });
    it("should report the active bounce while a submit is held", async () => {
      const { request } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, throttle));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      expect(result.current.bounce.active).toBeFalse();

      act(() => {
        result.current.submit({ payload: { name: "Second" } });
      });
      expect(result.current.bounce.active).toBeTrue();

      await advance(400);
      expect(result.current.bounce.active).toBeFalse();
    });
    it("should drop the held submit on reset and resolve it with an error response", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, throttle));
      const { responses, collect } = createCollector<typeof request>();
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
      });

      act(() => {
        result.current.bounce.reset();
      });
      await advance(1000);

      expect(calls).toHaveLength(1);
      expect(responses).toHaveLength(1);
      expect(responses[0].response.success).toBeFalse();
      expect(responses[0].response.error).toBeInstanceOf(Error);
      expect(result.current.bounce.active).toBeFalse();
    });
  });

  describe("given the throttle has no trailing timeout", () => {
    const leadingOnly = { ...throttle, bounceTimeout: 0 } as const;

    it("should send only the first submit of the interval", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, leadingOnly));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });
      await advance(1000);

      expect(calls).toHaveLength(1);
      expect(calls[0].request.payload).toStrictEqual({ name: "First" });
    });
    it("should resolve the dropped submits with an error response", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, leadingOnly));
      const { responses, collect } = createCollector<typeof request>();

      act(() => {
        result.current.submit({ payload: { name: "First" } }).then(collect("first"));
        result.current.submit({ payload: { name: "Second" } }).then(collect("second"));
        result.current.submit({ payload: { name: "Third" } }).then(collect("third"));
      });
      await advance();

      expect(responses.map((item) => item.label)).toStrictEqual(["second", "third"]);
      expect(responses.map((item) => item.response.success)).toStrictEqual([false, false]);
      expect(responses[0].response.error).toBeInstanceOf(Error);

      calls[0].succeed({ id: 1, name: "First" });
      await advance();

      expect(responses[2].label).toBe("first");
      expect(responses[2].response.data).toStrictEqual({ id: 1, name: "First" });
    });
    it("should send a submit again once the interval passed", async () => {
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request, leadingOnly));
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Dropped" } });
      });
      await advance(400);

      act(() => {
        result.current.submit({ payload: { name: "Second" } });
      });
      await advance();

      expect(calls.map((call) => call.request.payload)).toStrictEqual([{ name: "First" }, { name: "Second" }]);
    });
  });
});
