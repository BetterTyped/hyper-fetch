import { act, renderHook } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, settle } from "../../utils/gate.utils";

type Data = { value: string };

/**
 * A fetch and a refetch of the same request can be in flight together and answer in any order.
 * The hook has to end with the data of the request that was sent last.
 */
describe("useFetch [ Response order ]", () => {
  let request = createRequest<Data>();
  let calls = gateRequest(request);

  const renderData = () =>
    renderHook(() => {
      const { data, error, loading, refetch } = useFetch(request);
      return { data, error, loading, refetch };
    });

  /** Mount (first request) and refetch a moment later (second request) - both stay in flight */
  const startTwoRequests = async () => {
    const view = renderData();
    await advance();
    await advance(100);
    act(() => {
      view.result.current.refetch();
    });
    await advance();

    return view;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<Data>();
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the refetch answers before the first request", () => {
    it("should keep the data of the refetch", async () => {
      const { result } = await startTwoRequests();

      calls[1].succeed({ value: "new" });
      await settle();
      calls[0].succeed({ value: "old" });
      await settle();

      expect(result.current.data).toStrictEqual({ value: "new" });
      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ value: "new" });
      expect(result.current.loading).toBeFalse();
    });

    it("should not show the error of the first request", async () => {
      const { result } = await startTwoRequests();

      calls[1].succeed({ value: "new" });
      await settle();
      calls[0].fail(new Error("Too late"));
      await settle();

      expect(result.current.data).toStrictEqual({ value: "new" });
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBeFalse();
    });

    it("should give the same data to every component using the request", async () => {
      const first = await startTwoRequests();
      const second = renderData();
      await advance();

      calls[1].succeed({ value: "new" });
      await settle();
      calls[0].succeed({ value: "old" });
      await settle();

      expect(first.result.current.data).toStrictEqual({ value: "new" });
      expect(second.result.current.data).toStrictEqual({ value: "new" });
    });
  });

  describe("when the requests answer in the order they were sent", () => {
    it("should end with the data of the refetch", async () => {
      const { result } = await startTwoRequests();

      calls[0].succeed({ value: "old" });
      await settle();
      expect(result.current.data).toStrictEqual({ value: "old" });
      expect(result.current.loading).toBeTrue();

      calls[1].succeed({ value: "new" });
      await settle();

      expect(result.current.data).toStrictEqual({ value: "new" });
      expect(result.current.loading).toBeFalse();
    });
  });
});
