import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter, firebaseWebAdapter } from "../../../../src";
import { Tea } from "../../../utils/seed.data";

export const setTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseWebAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("set", () => {
    it("should set data", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 10 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
      const getReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });
      const setReq = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "set",
        })
        .setParams({ teaId: 1 })
        .setData(newData);

      await setReq.send();
      const { data, additionalData } = await getReq.send();
      expect(data).toStrictEqual(newData);
      expect(additionalData.snapshot.exists()).toBe(true);
    });
    it("should allow for removing data via set", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
      const getReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const setReq = client
        .createRequest<Tea, { data: null }>()({
          endpoint: ":teaId",
          method: "set",
        })
        .setParams({ teaId: 1 })
        .setData({ data: null });

      await setReq.send();
      const { data, additionalData } = await getReq.send();
      expect(data).toBe(null);
      expect(additionalData.snapshot.exists()).toBe(false);
    });
  });
};
