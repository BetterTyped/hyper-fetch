import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter } from "adapter";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";
import { Tea } from "../../../../utils";

export const pushTestSuite = (adapterFunction: () => ReturnType<typeof firebaseAdminAdapter>) => {
  describe("push", () => {
    let client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    beforeEach(() => {
      client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    });

    it("should allow for adding data to a list", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 100 } as Tea;
      const getReq = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "get",
      });
      const pushReq = client
        .createRequest<{ response: Tea; payload: Tea }>()({
          endpoint: "",
          method: "push",
          options: {},
        })
        .setData(newData);
      const { data: pushedData, extra } = await pushReq.send();
      const { data } = await getReq.send();

      expect(data).toHaveLength(11);
      expect(data).toContainEqual({ ...newData, __key: pushedData.__key });
      expect(extra).toHaveProperty("key");
    });
    it("should emit lifecycle events", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2043, name: "Pou Ran Do Cha", amount: 100 } as Tea;

      const pushReq = client
        .createRequest<{ response: Tea; payload: Tea }>()({
          endpoint: "teas/",
          method: "push",
        })
        .setData(newData);

      await testLifecycleEvents(pushReq);
    });
  });
};
