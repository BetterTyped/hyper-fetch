import { Client } from "@hyper-fetch/core";

import { FirebaseAdapter } from "adapter";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";
import { Tea } from "../../../../utils";

export const removeTestSuite = (adapterFunction: () => ReturnType<typeof FirebaseAdapter>) => {
  let client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
  beforeEach(() => {
    client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
  });
  describe("remove", () => {
    it("should allow for removing data", async () => {
      const getReq = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });

      const removeReq = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "deleteDoc",
        })
        .setParams({ teaId: 1 });

      await removeReq.send();
      const { data, extra } = await getReq.send();
      expect(data).toBe(null);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(extra?.snapshot?.exists()).toBe(false);
    });
    it("should emit lifecycle events", async () => {
      const removeReq = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "deleteDoc",
        })
        .setParams({ teaId: 1 });

      await testLifecycleEvents(removeReq);
    });
  });
};
