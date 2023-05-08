import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter, firebaseWebAdapter } from "../../../../src";
import { Tea } from "../../../utils/seed.data";

export const updateTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseWebAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("update", () => {
    it("should allow for updating data", async () => {
      const newData = { name: "Pou Ran Do Cha", amount: 100, year: 966 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
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
  });
};
