import { expectType, expectNotType } from "@hyper-fetch/testing";
import { useListener } from "hooks/use-listener";

import { createListener } from "../../utils/listener.utils";

const listener = createListener<{ prices: Record<string, number>; updatedAt: number }>();

describe("useListener [ TypeScript ]", () => {
  describe("select", () => {
    it("should infer the selected data type", () => {
      const useSelected = () => useListener(listener, { select: (message) => message.prices.btc });
      const data = null as unknown as ReturnType<typeof useSelected>["data"];
      expectType<number | null>().assert(data);
      expectNotType<{ prices: Record<string, number>; updatedAt: number } | null>().assert(data);
    });

    it("should keep the message type without selector", () => {
      const useDefault = () => useListener(listener);
      const data = null as unknown as ReturnType<typeof useDefault>["data"];
      expectType<{ prices: Record<string, number>; updatedAt: number } | null>().assert(data);
    });
  });
});
