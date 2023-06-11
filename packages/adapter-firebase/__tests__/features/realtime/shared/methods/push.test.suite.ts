import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter } from "adapter/index.server";
import { firebaseAdapter } from "adapter/index.browser";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";
import { Tea } from "../../../../utils/seed/seed.data";

export const pushTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("push", () => {
    let client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    beforeEach(() => {
      client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    });

    it("should allow for adding data to a list", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 100 } as Tea;
      const getReq = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get",
      });
      const pushReq = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "push",
          options: {},
        })
        .setData(newData);
      const { extra } = await pushReq.send();
      const { data } = await getReq.send();

      expect(data).toHaveLength(11);
      expect(data).toContainEqual(newData);
      expect(extra).toHaveProperty("key");
    });
    it("should emit lifecycle events", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2043, name: "Pou Ran Do Cha", amount: 100 } as Tea;

      const pushReq = client
        .createRequest<Tea, Tea>()({
          endpoint: "teas/",
          method: "push",
        })
        .setData(newData);

      await testLifecycleEvents(pushReq);
    });
  });
};
