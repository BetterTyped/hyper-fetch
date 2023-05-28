import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter, firebaseBrowserAdapter } from "../../../../src";
import { testLifecycleEvents } from "../../../shared/request-events.shared";
import { Tea } from "../../../utils/seed.data";

export const setTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseBrowserAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("set", () => {
    let client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
    beforeEach(() => {
      client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
    });
    it("should set data", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 10 } as Tea;

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
      const { data, extra } = await getReq.send();
      expect(data).toStrictEqual(newData);
      expect(extra.snapshot.exists()).toBe(true);
    });
    it("should allow for removing data via set", async () => {
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
      const { data, extra } = await getReq.send();
      expect(data).toBe(null);
      expect(extra.snapshot.exists()).toBe(false);
    });
    it("should emit lifecycle events", async () => {
      const setReq = client
        .createRequest<Tea, { data: null }>()({
          endpoint: ":teaId",
          method: "set",
        })
        .setParams({ teaId: 1 })
        .setData({ data: null });

      await testLifecycleEvents(setReq);
    });
  });
};
