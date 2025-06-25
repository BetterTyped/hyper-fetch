import { Client } from "@hyper-fetch/core";

import { FirebaseAdapter } from "adapter";
import { Tea } from "../../../../utils";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";

export const deleteDocTestSuite = (adapterFunction: () => ReturnType<typeof FirebaseAdapter>) => {
  describe("deleteDoc", () => {
    it("should allow for removing data", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
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

      const { data: beforeRemoval } = await getReq.send();
      await removeReq.send();
      const { data } = await getReq.send();
      expect(beforeRemoval).toStrictEqual({
        __key: "1",
        amount: 150,
        year: 2023,
        origin: "China",
        name: "Taiping Hou Kui",
        type: "Green",
      });
      expect(data).toBe(null);
      // expect(extra.snapshot.exists()).toBe(false);
    });
    it("should emit lifecycle events", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());

      const request = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "deleteDoc",
        })
        .setParams({ teaId: 1 });

      await testLifecycleEvents(request);
    });
  });
};
