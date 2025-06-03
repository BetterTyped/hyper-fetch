import { Client } from "@hyper-fetch/core";

import { FirebaseAdapter } from "adapter";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";
import { Tea } from "../../../../utils";

export const updateTestSuite = (adapterFunction: () => ReturnType<typeof FirebaseAdapter>) => {
  describe("update", () => {
    let client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    beforeEach(() => {
      client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    });

    it("should allow for updating data", async () => {
      const newData = { name: "Pou Ran Do Cha", amount: 100, year: 966 } as Tea;
      const updateReq = client
        .createRequest<{ response: Tea; payload: Tea }>()({
          endpoint: ":teaId",
          method: "updateDoc",
        })
        .setPayload(newData);
      const getReq = client.createRequest<{ response: Tea }>()({
        endpoint: ":teaId",
        method: "getDoc",
      });
      await updateReq.send({ params: { teaId: 1 } });
      const { data } = await getReq.send({ params: { teaId: 1 } });
      expect(data).toStrictEqual({ ...newData, origin: "China", type: "Green" });
    });
    it("should emit lifecycle events", async () => {
      const newData = { name: "Pou Ran Do Cha", amount: 100, year: 966 } as Tea;

      const updateReq = client
        .createRequest<{ response: Tea; payload: Tea }>()({
          endpoint: ":teaId",
          method: "updateDoc",
        })
        .setPayload(newData);
      await testLifecycleEvents(updateReq);
    });
  });
};
