import { Client } from "@hyper-fetch/core";

import { adapterAdmin, adapterWeb } from "../../../../src";
import { Tea } from "../../../utils/seed.data";
import { testLifecycleEvents } from "../../../shared/request-events.shared";

export const deleteDocTestSuite = (
  adapterFunction: () => ReturnType<typeof adapterWeb> | ReturnType<typeof adapterAdmin>,
) => {
  describe("deleteDoc", () => {
    it("should allow for removing data", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
      const getReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });

      const removeReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "deleteDoc",
        })
        .setParams({ teaId: 1 });

      const { data: beforeRemoval } = await getReq.send();
      await removeReq.send();
      const { data } = await getReq.send();
      expect(beforeRemoval).toStrictEqual({
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
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);

      const request = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "deleteDoc",
        })
        .setParams({ teaId: 1 });

      await testLifecycleEvents(request);
    });
  });
};
