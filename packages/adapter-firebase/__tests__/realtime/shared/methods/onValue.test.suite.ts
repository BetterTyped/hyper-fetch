import { Client } from "@hyper-fetch/core";

import { Tea } from "../../../utils/seed.data";
import { firebaseAdminAdapter, firebaseWebAdapter } from "../../../../src";

export const onValueTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseWebAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("onValue", () => {
    it("should return data available for collection", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "onValue",
      });
      const { data, extra, status, success, error } = await req.send();
      expect(data).toHaveLength(10);
      expect(extra).toHaveProperty("snapshot");
      expect(extra).toHaveProperty("unsubscribe");
      expect(extra).toHaveProperty("ref");
      expect(status).toBe("success");
      expect(success).toBe(true);
      expect(error).toBe(null);

      extra.unsubscribe();
    });
    it("should return data available for doc", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
      const req = client
        .createRequest<Tea[]>()({
          endpoint: ":teaId",
          method: "onValue",
        })
        .setParams({ teaId: 1 });
      const { data, extra, status, success, error } = await req.send();
      expect(data).toStrictEqual({ amount: 150, name: "Taiping Hou Kui", origin: "China", type: "Green", year: 2023 });
      expect(extra).toHaveProperty("snapshot");
      expect(extra).toHaveProperty("unsubscribe");
      expect(extra).toHaveProperty("ref");
      expect(status).toBe("success");
      expect(success).toBe(true);
      expect(error).toBe(null);

      extra.unsubscribe();
    });
    it("should return emptyResource status for non existing doc", async () => {
      const client = new Client({ url: "bees/" }).setAdapter(adapterFunction);
      const req = client
        .createRequest<Tea[]>()({
          endpoint: ":teaId",
          method: "onValue",
        })
        .setParams({ teaId: 1 });
      const { data, extra, status, success, error } = await req.send();
      expect(data).toStrictEqual(null);
      expect(extra).toHaveProperty("snapshot");
      expect(extra).toHaveProperty("unsubscribe");
      expect(extra).toHaveProperty("ref");
      expect(status).toBe("emptyResource");
      expect(success).toBe(true);
      expect(error).toBe(null);

      extra.unsubscribe();
    });
    it("should return emptyResource status for non existing collection", async () => {
      const client = new Client({ url: "bees/" }).setAdapter(adapterFunction);
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "onValue",
      });
      const { data, extra, status, success, error } = await req.send();
      expect(data).toStrictEqual(null);
      expect(extra).toHaveProperty("snapshot");
      expect(extra).toHaveProperty("unsubscribe");
      expect(extra).toHaveProperty("ref");
      expect(status).toBe("emptyResource");
      expect(success).toBe(true);
      expect(error).toBe(null);

      extra.unsubscribe();
    });
    it("should change HF cache if data is changed in firebase after onValue listener creation", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
      const onValueReq = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "onValue",
      });
      const newData = { origin: "Poland", type: "Green", year: 2043, name: "Pou Ran Do Cha", amount: 100 } as Tea;
      const pushReq = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "push",
        })
        .setData(newData);
      const {
        data,
        extra: { unsubscribe },
      } = await onValueReq.send();

      const { data: cacheAfterOnValue } = onValueReq.client.cache.get(onValueReq.cacheKey);

      await pushReq.send();

      const { data: cacheAfterPush } = onValueReq.client.cache.get(onValueReq.cacheKey);

      if (unsubscribe) {
        unsubscribe();
      }

      await pushReq.send();

      const { data: cacheAfterUnsub } = onValueReq.client.cache.get(onValueReq.cacheKey);

      expect(data).toStrictEqual(cacheAfterOnValue);
      expect(Object.values(cacheAfterPush)).toHaveLength(11);
      expect(Object.values(cacheAfterUnsub)).toHaveLength(11);
    });
    it("should not change HF cache if method is called with onlyOnce option", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
      const onValueReq = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "onValue",
        options: { onlyOnce: true },
      });
      const newData = { origin: "Poland", type: "Green", year: 2043, name: "Pou Ran Do Cha", amount: 100 } as Tea;
      const pushReq = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "push",
        })
        .setData(newData);
      const {
        data,
        extra: { unsubscribe },
      } = await onValueReq.send();

      const { data: cacheAfterOnValue } = onValueReq.client.cache.get(onValueReq.cacheKey);

      await pushReq.send();

      const { data: cacheAfterPush } = onValueReq.client.cache.get(onValueReq.cacheKey);

      if (unsubscribe) {
        unsubscribe();
      }

      expect(data).toStrictEqual(cacheAfterOnValue);
      expect(cacheAfterPush).toHaveLength(10);
    });
  });
};
