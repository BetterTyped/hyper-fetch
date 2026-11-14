import { useObject } from "@hyper-fetch/ai/react";
import { Client } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";

const schema = z.object({ name: z.string(), age: z.number() });

const createRequest = (chunks: string[], chunkTime = 0) =>
  new Client({ url: "http://react-object.test" })
    .createRequest<{ response: string; payload: { prompt: string } }>()({ endpoint: "/api/object", method: "POST" })
    .setMock(() => ({ chunks, status: 200 }), { requestTime: 0, responseTime: 0, chunkTime });

describe("useObject", () => {
  it("should stream a typed object", async () => {
    const request = createRequest(['{"name":"A', 'da","age":3', "6}"], 10);
    const seen: unknown[] = [];
    const { result } = renderHook(() => {
      const value = useObject({ request, schema });
      seen.push(value.object);
      return value;
    });

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.submit({ prompt: "a person" });
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.object).toEqual({ name: "Ada", age: 36 });
    expect(result.current.isLoading).toBe(false);
    expect(seen).toContainEqual({ name: "A" });
    expectTypeOf(result.current.object).toEqualTypeOf<{ name?: string; age?: number } | undefined>();
  });

  it("should type submit by the request payload", () => {
    const request = createRequest([]);
    const { result } = renderHook(() => useObject({ request, schema }));
    const check = () => {
      result.current.submit({ prompt: "ok" });
      // @ts-expect-error - wrong payload
      result.current.submit({ nope: true });
    };
    expect(check).toBeTypeOf("function");
  });

  it("should stop, clear and stop on unmount", async () => {
    const request = createRequest(['{"name":"x"', ',"age":1}'], 30);
    const { result, unmount } = renderHook(() => useObject({ request, schema }));

    act(() => {
      result.current.submit({ prompt: "x" });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.clear());
    expect(result.current.object).toBeUndefined();
    unmount();
  });
});
