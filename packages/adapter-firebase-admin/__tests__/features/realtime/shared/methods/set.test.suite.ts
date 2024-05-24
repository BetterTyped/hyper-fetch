import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter } from "adapter";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";
import { Tea } from "../../../../utils";

export const setTestSuite = (adapterFunction: () => ReturnType<typeof firebaseAdminAdapter>) => {
  describe("set", () => {
    let client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    beforeEach(() => {
      client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    });
    it("should set data", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 10 } as Tea;

      const getReq = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });
      const setReq = client
        .createRequest<{ response: Tea; payload: Tea }>()({
          endpoint: ":teaId",
          method: "set",
        })
        .setParams({ teaId: 1 })
        .setData(newData);

      await setReq.send();
      const { data, extra } = await getReq.send();
      expect(data).toStrictEqual(newData);
      expect(extra && "snapshot" in extra && "exists" in extra.snapshot && extra.snapshot.exists()).toBe(true);
    });
    it("should allow for removing data via set", async () => {
      const getReq = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const setReq = client
        .createRequest<{ response: Tea; payload: { data: null } }>()({
          endpoint: ":teaId",
          method: "set",
        })
        .setParams({ teaId: 1 })
        .setData({ data: null });

      await setReq.send();
      const { data, extra } = await getReq.send();
      expect(data).toBe(null);
      expect(extra && "snapshot" in extra && "exists" in extra.snapshot && extra.snapshot.exists()).toBe(false);
    });
    it("should emit lifecycle events", async () => {
      const setReq = client
        .createRequest<{ response: Tea; payload: { data: null } }>()({
          endpoint: ":teaId",
          method: "set",
        })
        .setParams({ teaId: 1 })
        .setData({ data: null });

      await testLifecycleEvents(setReq);
    });
  });
};
