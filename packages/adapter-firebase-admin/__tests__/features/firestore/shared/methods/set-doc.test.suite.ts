import { Client } from "@hyper-fetch/core";

import { Tea } from "../../../../utils";
import { firebaseAdminAdapter } from "adapter";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";

export const setDocTestSuite = (adapterFunction: () => ReturnType<typeof firebaseAdminAdapter>) => {
  describe("setDoc", () => {
    it("should set data", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 10 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const getReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });
      const setReq = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "setDoc",
        })
        .setParams({ teaId: 1 })
        .setData(newData);

      await setReq.send();
      const { data } = await getReq.send();

      expect(data).toStrictEqual({ ...newData, __key: "1" });
    });
    it("should merge data if merge options is passed", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const getReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });
      const { data: existingData } = await getReq.send();
      const setReq = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "setDoc",
          options: { merge: true },
        })
        .setParams({ teaId: 1 })
        .setData({ name: "Pou Ran Do Cha" } as Tea);

      await setReq.send();
      const { data } = await getReq.send();

      expect(data).toStrictEqual({ ...existingData, name: "Pou Ran Do Cha" });
      // expect(extra.snapshot.exists()).toBe(true);
    });
    it("should emit lifecycle events", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());

      const request = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "setDoc",
          options: { merge: true },
        })
        .setParams({ teaId: 1 })
        .setData({ name: "Pou Ran Do Cha" } as Tea);

      await testLifecycleEvents(request);
    });
  });
};
