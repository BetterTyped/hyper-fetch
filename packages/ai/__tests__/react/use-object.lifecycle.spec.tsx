import { ObjectStreamError } from "@hyper-fetch/ai";
import { useObject } from "@hyper-fetch/ai/react";
import { Client } from "@hyper-fetch/core";
import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { z } from "zod";

const schema = z.object({ name: z.string(), age: z.number() });

const createEndpoint = (responses: string[][], chunkTime = 0) => {
  const client = new Client({ url: "http://react-object-lifecycle.test" });
  let call = 0;
  const request = client
    .createRequest<{ response: string; payload: { prompt: string } }>()({ endpoint: "/api/object", method: "POST" })
    .setMock(
      () => {
        const chunks = responses[Math.min(call, responses.length - 1)];
        call += 1;
        return { chunks, status: 200 };
      },
      { requestTime: 0, responseTime: 0, chunkTime },
    );
  return { client, request, calls: () => call };
};

describe("useObject [ Lifecycle ]", () => {
  it("should go through submitted, streaming and ready", async () => {
    const { request } = createEndpoint([['{"name":"A', 'da","age":36}']], 1);
    const statuses: string[] = [];
    const { result } = renderHook(() => {
      const value = useObject({ request, schema });
      if (statuses.at(-1) !== value.status) {
        statuses.push(value.status);
      }
      return value;
    });

    await act(async () => {
      await result.current.submit({ prompt: "x" });
    });

    expect(statuses).toEqual(["ready", "submitted", "streaming", "ready"]);
    expect(result.current.object).toEqual({ name: "Ada", age: 36 });
  });

  it("should expose a validation error and recover on the next submit", async () => {
    const { request } = createEndpoint([['{"name":"Ada","age":"old"}'], ['{"name":"Ada","age":36}']]);
    const onError = vi.fn();
    const { result } = renderHook(() => useObject({ request, schema, onError }));

    await act(async () => {
      await result.current.submit({ prompt: "x" });
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.submit({ prompt: "x" });
    });
    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeUndefined();
    expect(result.current.object).toEqual({ name: "Ada", age: 36 });
  });

  it("should fail on incomplete JSON", async () => {
    const { request } = createEndpoint([['{"name":"Ada"']]);
    const { result } = renderHook(() => useObject({ request, schema }));

    await act(async () => {
      await result.current.submit({ prompt: "x" });
    });

    expect(result.current.error).toBeInstanceOf(ObjectStreamError);
    // The partial object stays visible
    expect(result.current.object).toEqual({ name: "Ada" });
  });

  it("should call the latest callbacks", async () => {
    const { request } = createEndpoint([['{"name":"Ada","age":36}']]);
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ onFinish }) => useObject({ request, schema, onFinish }), {
      initialProps: { onFinish: first },
    });

    rerender({ onFinish: second });
    await act(async () => {
      await result.current.submit({ prompt: "x" });
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ object: { name: "Ada", age: 36 }, error: undefined });
  });

  it("should work under StrictMode", async () => {
    const { request, calls } = createEndpoint([['{"name":"Ada","age":36}']]);
    const { result } = renderHook(() => useObject({ request, schema }), { wrapper: StrictMode });

    await act(async () => {
      await result.current.submit({ prompt: "x" });
    });

    expect(calls()).toBe(1);
    expect(result.current.object).toEqual({ name: "Ada", age: 36 });
  });

  it("should close the stream when the component unmounts", async () => {
    const { client, request } = createEndpoint([['{"name":"A', "d", "a", '","age":3', "6}"]], 2);
    const { result, unmount } = renderHook(() => useObject({ request, schema }));

    let firstChunk = () => {};
    const receivedFirstChunk = new Promise<void>((resolve) => {
      firstChunk = resolve;
    });
    client.requestManager.events.onResponseChunk(() => firstChunk());

    let submitted: Promise<void> | undefined;
    act(() => {
      submitted = result.current.submit({ prompt: "x" });
    });
    await act(async () => {
      await receivedFirstChunk;
    });
    expect(result.current.object).toEqual({ name: "A" });
    const chunksAfterUnmount = vi.fn();
    unmount();
    client.requestManager.events.onResponseChunk(chunksAfterUnmount);
    await submitted;

    expect(chunksAfterUnmount).not.toHaveBeenCalled();
  });

  it("should only keep the latest of two quick submits", async () => {
    const { request, calls } = createEndpoint([['{"name":"First","age":1}'], ['{"name":"Second","age":2}']], 1);
    const onFinish = vi.fn();
    const { result } = renderHook(() => useObject({ request, schema, onFinish }));

    await act(async () => {
      const first = result.current.submit({ prompt: "1" });
      const second = result.current.submit({ prompt: "2" });
      await Promise.all([first, second]);
    });

    expect(calls()).toBe(2);
    expect(result.current.object).toEqual({ name: "Second", age: 2 });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("should keep submit, stop and clear stable across renders", async () => {
    const { request } = createEndpoint([['{"name":"Ada","age":36}']]);
    const { result, rerender } = renderHook(() => useObject({ request, schema }));
    const { submit, stop, clear } = result.current;

    rerender();
    await act(async () => {
      await result.current.submit({ prompt: "x" });
    });

    expect(result.current.submit).toBe(submit);
    expect(result.current.stop).toBe(stop);
    expect(result.current.clear).toBe(clear);
  });
});
