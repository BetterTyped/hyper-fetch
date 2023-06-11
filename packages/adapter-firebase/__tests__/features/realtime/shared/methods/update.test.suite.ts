import { Client } from "@hyper-fetch/core";

import { firebaseAdapter } from "adapter";
import { firebaseAdminAdapter } from "adapter/index.server";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";
import { Tea } from "../../../../utils";

export const updateTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("update", () => {
    let client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    beforeEach(() => {
      client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    });

    it("should allow for updating data", async () => {
      const newData = { name: "Pou Ran Do Cha", amount: 100, year: 966 } as Tea;
      const updateReq = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "update",
        })
        .setData(newData);
      const getReq = client.createRequest<Tea>()({
        endpoint: ":teaId",
        method: "get",
      });
      await updateReq.send({ params: { teaId: 1 } });
      const { data } = await getReq.send({ params: { teaId: 1 } });
      expect(data).toStrictEqual({ ...newData, origin: "China", type: "Green" });
    });
    it("should emit lifecycle events", async () => {
      const newData = { name: "Pou Ran Do Cha", amount: 100, year: 966 } as Tea;

      const updateReq = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "update",
        })
        .setData(newData);
      await testLifecycleEvents(updateReq);
    });
  });
};
