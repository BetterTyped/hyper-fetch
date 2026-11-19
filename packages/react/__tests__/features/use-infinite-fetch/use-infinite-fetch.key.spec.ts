import { getInfiniteKey } from "hooks/use-infinite-fetch/use-infinite-fetch.utils";

import { createRequest } from "../../utils";

describe("useInfiniteFetch [ Key ]", () => {
  const pagination = { initialPageParam: 0 };

  describe("when the payload holds a BigInt", () => {
    it("should build the key", () => {
      const request = createRequest<unknown, { total: bigint }>().setPayload({ total: 1n });

      expect(() => getInfiniteKey(request, pagination)).not.toThrow();
    });

    it("should change the key together with the BigInt", () => {
      const request = createRequest<unknown, { total: bigint | string }>();

      const one = getInfiniteKey(request.setPayload({ total: 1n }), pagination);
      const two = getInfiniteKey(request.setPayload({ total: 2n }), pagination);
      const digits = getInfiniteKey(request.setPayload({ total: "1" }), pagination);

      expect(one).toBe(getInfiniteKey(request.setPayload({ total: 1n }), pagination));
      expect(one).not.toBe(two);
      expect(one).not.toBe(digits);
    });
  });

  describe("when the pagination holds functions", () => {
    it("should change the key together with the function source", () => {
      const request = createRequest();

      const first = getInfiniteKey(request, { getNextPageParam: () => 1 });
      const second = getInfiniteKey(request, { getNextPageParam: () => 2 });

      expect(first).toBe(getInfiniteKey(request, { getNextPageParam: () => 1 }));
      expect(first).not.toBe(second);
    });
  });
});
