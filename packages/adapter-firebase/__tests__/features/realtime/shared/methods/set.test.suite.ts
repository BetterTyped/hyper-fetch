import { Client } from "@hyper-fetch/core";

import { FirebaseAdapter } from "adapter";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";
import { Tea } from "../../../../utils";

export const setTestSuite = (adapterFunction: () => ReturnType<typeof FirebaseAdapter>) => {
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
        .setPayload(newData);

      await setReq.send();
      const { data, extra } = await getReq.send();
      expect(data).toStrictEqual(newData);
      expect(extra.snapshot.exists()).toBe(true);
    });
    it("should allow for removing data via set", async () => {
      const getReq = client
        .createRequest<{ response: Tea }>()({
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
        .setPayload({ data: null });

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
        .setPayload({ data: null });

      await testLifecycleEvents(setReq);
    });
  });
};
