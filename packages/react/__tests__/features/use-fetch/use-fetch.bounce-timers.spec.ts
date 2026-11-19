import { act, renderHook } from "@testing-library/react";
import type { UseFetchOptionsType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, settle } from "../../utils/gate.utils";

type Data = { search: string };
type Options = UseFetchOptionsType<ReturnType<typeof createRequest<Data>>>;

const bounceTime = 1000;

describe("useFetch [ Bounce Timers ]", () => {
  let request = createRequest<Data>();
  let calls = gateRequest(request);

  const renderSearch = (options: Options) => {
    return renderHook(
      ({ search, ...rest }: { search: string } & Options) => {
        const { data, bounce } = useFetch(request.setQueryParams({ search }), { ...options, ...rest } as never);
        return { data, active: bounce.active, reset: bounce.reset };
      },
      { initialProps: { search: "a" } as { search: string } & Options },
    );
  };

  const searches = () => calls.map((call) => call.request.queryParams.search);

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<Data>();
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when debounce is used", () => {
    const options: Options = { bounce: true, bounceType: "debounce", bounceTime };

    it("should send the initial request right away", async () => {
      renderSearch(options);
      await advance();

      expect(searches()).toStrictEqual(["a"]);
    });
    it("should wait with the request for the changed key", async () => {
      const { rerender } = renderSearch(options);
      await advance();

      rerender({ search: "ab" });
      await advance(bounceTime - 1);
      expect(searches()).toStrictEqual(["a"]);

      await advance(1);
      expect(searches()).toStrictEqual(["a", "ab"]);
    });
    it("should send a single request for the last of the quick changes", async () => {
      const { rerender } = renderSearch(options);
      await advance();

      for (const search of ["ab", "abc", "abcd", "abcde"]) {
        rerender({ search });
        // eslint-disable-next-line no-await-in-loop
        await advance(bounceTime / 2);
      }
      await advance(bounceTime);

      expect(searches()).toStrictEqual(["a", "abcde"]);
    });
    it("should expose the active state while waiting", async () => {
      const { rerender, result } = renderSearch(options);
      await advance();
      expect(result.current.active).toBeFalse();

      rerender({ search: "ab" });
      expect(result.current.active).toBeTrue();

      await advance(bounceTime);
      expect(result.current.active).toBeFalse();
    });
    it("should cancel the waiting request with reset", async () => {
      const { rerender, result } = renderSearch(options);
      await advance();

      rerender({ search: "ab" });
      act(() => {
        result.current.reset();
      });
      await advance(bounceTime * 2);

      expect(searches()).toStrictEqual(["a"]);
    });
    it("should not send the waiting request after unmount", async () => {
      const { rerender, unmount } = renderSearch(options);
      await advance();

      rerender({ search: "ab" });
      unmount();
      await advance(bounceTime * 2);

      expect(searches()).toStrictEqual(["a"]);
    });
    it("should not send the waiting request when the hook gets disabled", async () => {
      const { rerender } = renderSearch(options);
      await advance();

      rerender({ search: "ab" });
      rerender({ search: "ab", disabled: true });
      await advance(bounceTime * 2);

      expect(searches()).toStrictEqual(["a"]);
    });
    it("should debounce the dependencies changes", async () => {
      const { rerender } = renderSearch({ ...options, dependencies: [0] });
      await advance();
      calls[0].succeed({ search: "a" });
      await settle();

      rerender({ search: "a", dependencies: [1] });
      rerender({ search: "a", dependencies: [2] });
      await advance(bounceTime - 1);
      expect(calls).toHaveLength(1);

      await advance(1);
      expect(calls).toHaveLength(2);
    });
    it("should show the data of the debounced request", async () => {
      const { rerender, result } = renderSearch(options);
      await advance();
      calls[0].succeed({ search: "a" });
      await settle();

      rerender({ search: "ab" });
      await advance(bounceTime);
      calls[1].succeed({ search: "ab" });
      await settle();

      expect(result.current.data).toStrictEqual({ search: "ab" });
    });
    it("should not debounce the changes without the bounce option", async () => {
      const { rerender } = renderSearch({ bounce: false, bounceTime });
      await advance();

      rerender({ search: "ab" });
      await advance();

      expect(searches()).toStrictEqual(["a", "ab"]);
    });
  });

  describe("when throttle is used", () => {
    const options: Options = { bounce: true, bounceType: "throttle", bounceTime, bounceTimeout: bounceTime };

    it("should send the initial request right away", async () => {
      renderSearch(options);
      await advance();

      expect(searches()).toStrictEqual(["a"]);
    });
    it("should send the first change right away", async () => {
      const { rerender } = renderSearch(options);
      await advance();

      rerender({ search: "ab" });
      await advance();

      expect(searches()).toStrictEqual(["a", "ab"]);
    });
    it("should hold the changes made during the throttle interval and send the last one", async () => {
      const { rerender } = renderSearch(options);
      await advance();
      rerender({ search: "ab" });
      await advance();

      rerender({ search: "abc" });
      rerender({ search: "abcd" });
      await advance(bounceTime - 1);
      expect(searches()).toStrictEqual(["a", "ab"]);

      await advance(1);
      expect(searches()).toStrictEqual(["a", "ab", "abcd"]);
    });
    it("should not send the held request after unmount", async () => {
      const { rerender, unmount } = renderSearch(options);
      await advance();
      rerender({ search: "ab" });
      await advance();

      rerender({ search: "abc" });
      unmount();
      await advance(bounceTime * 2);

      expect(searches()).toStrictEqual(["a", "ab"]);
    });
  });
});
