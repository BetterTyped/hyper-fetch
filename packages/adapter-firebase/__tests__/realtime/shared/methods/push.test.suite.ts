import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter, firebaseWebAdapter } from "../../../../src";
import { Tea } from "../../../utils/seed.data";

export const pushTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseWebAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("push", () => {
    it("should allow for adding data to a list", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 100 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
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
      const { additionalData } = await pushReq.send();
      const { data } = await getReq.send();

      expect(data).toHaveLength(11);
      expect(data).toContainEqual(newData);
      expect(additionalData).toHaveProperty("key");
    });
  });
};
