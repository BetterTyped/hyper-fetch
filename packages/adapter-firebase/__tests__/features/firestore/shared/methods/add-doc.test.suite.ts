import { Client } from "@hyper-fetch/core";

import { firebaseAdapter } from "adapter/index.browser";
import { firebaseAdminAdapter } from "adapter/index.server";
import { Tea } from "../../../../utils";

export const addDocTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("addDoc", () => {
    it("should allow for adding data to a list", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 100 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const getReq = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const pushReq = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "addDoc",
          options: {},
        })
        .setData(newData);
      await pushReq.send();
      const { data } = await getReq.send();
      const arrayedData = Object.values(data);

      expect(arrayedData).toHaveLength(11);
      expect(arrayedData).toContainEqual(newData);
    });
  });
};
