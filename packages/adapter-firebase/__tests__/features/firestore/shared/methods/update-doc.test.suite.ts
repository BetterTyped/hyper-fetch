import { Client } from "@hyper-fetch/core";

import { FirebaseAdapter } from "adapter";
import { Tea } from "../../../../utils";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";

export const updateDocTestSuite = (adapterFunction: () => ReturnType<typeof FirebaseAdapter>) => {
  describe("updateDoc", () => {
    it("should allow for updating data", async () => {
      const newData = { name: "Pou Ran Do Cha", amount: 100, year: 966 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const updateReq = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "updateDoc",
        })
        .setData(newData);
      const getReq = client.createRequest<Tea>()({
        endpoint: ":teaId",
        method: "getDoc",
      });
      await updateReq.send({ params: { teaId: 1 } });
      const { data } = await getReq.send({ params: { teaId: 1 } });
      expect(data).toStrictEqual({ ...newData, origin: "China", type: "Green", __key: "1" });
    });
    it("should emit lifecycle events", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const newData = { name: "Pou Ran Do Cha", amount: 100, year: 966 } as Tea;

      const request = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "updateDoc",
        })
        .setData(newData);

      await testLifecycleEvents(request);
    });
  });
};
