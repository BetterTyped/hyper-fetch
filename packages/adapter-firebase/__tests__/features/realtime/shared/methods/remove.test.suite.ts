import { Client } from "@hyper-fetch/core";

import { firebaseAdapter } from "adapter";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";
import { Tea } from "../../../../utils";

export const removeTestSuite = (adapterFunction: () => ReturnType<typeof firebaseAdapter>) => {
  let client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
  beforeEach(() => {
    client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
  });
  describe("remove", () => {
    it("should allow for removing data", async () => {
      const getReq = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const removeReq = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "remove",
        })
        .setParams({ teaId: 1 });

      await removeReq.send();
      const { data, extra } = await getReq.send();
      expect(data).toBe(null);
      expect(extra && "snapshot" in extra && "exists" in extra.snapshot && extra.snapshot.exists()).toBe(false);
    });
    it("should emit lifecycle events", async () => {
      const removeReq = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "remove",
        })
        .setParams({ teaId: 1 });

      await testLifecycleEvents(removeReq);
    });
  });
};
