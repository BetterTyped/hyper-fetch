import { Client } from "@hyper-fetch/core";

import { adapterAdmin, adapterWeb } from "../../../../src";
import { testLifecycleEvents } from "../../../shared/request-events.shared";
import { Tea } from "../../../utils/seed.data";

export const removeTestSuite = (
  adapterFunction: () => ReturnType<typeof adapterWeb> | ReturnType<typeof adapterAdmin>,
) => {
  let client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
  beforeEach(() => {
    client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
  });
  describe("remove", () => {
    it("should allow for removing data", async () => {
      const getReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const removeReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "remove",
        })
        .setParams({ teaId: 1 });

      await removeReq.send();
      const { data, extra } = await getReq.send();
      expect(data).toBe(null);
      expect(extra.snapshot.exists()).toBe(false);
    });
    it("should emit lifecycle events", async () => {
      const removeReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "remove",
        })
        .setParams({ teaId: 1 });

      await testLifecycleEvents(removeReq);
    });
  });
};
