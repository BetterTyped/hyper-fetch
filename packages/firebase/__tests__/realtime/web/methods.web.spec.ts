import { set, ref, DataSnapshot } from "firebase/database";
import { Client } from "@hyper-fetch/core";

import { firebaseWebAdapter } from "../../../src/adapter/adapter.firebase.web";
import { realtimeDbWeb } from "./initialize.web";
import { seedRealtimeDatabaseWeb } from "../../utils/seed.web";
import { Tea } from "../../utils/seed.data";

describe("Realtime Database Web [ Methods ]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDbWeb, "teas/"), null);
    await seedRealtimeDatabaseWeb(realtimeDbWeb);
  });

  afterAll(async () => {
    await set(ref(realtimeDbWeb, "teas/"), null);
  });

  describe("onValue", () => {
    it("should return data available for collection", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "onValue", // shows RealtimeDBMethods | FirestoreDBMethods type - need to fix to show only one
      });
      const { data, additionalData, status, isSuccess, error } = await req.send();
      expect(data).toHaveLength(10);
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("unsubscribe");
      expect(additionalData).toHaveProperty("ref");
      expect(additionalData.snapshot).toBeInstanceOf(DataSnapshot);
      expect(status).toBe("success");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);

      additionalData.unsubscribe();
    });
    it("should return data available for doc", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      const req = client
        .createRequest<Tea[]>()({
          endpoint: ":teaId",
          method: "onValue",
        })
        .setParams({ teaId: 1 });
      const { data, additionalData, status, isSuccess, error } = await req.send();
      expect(data).toStrictEqual({ amount: 150, name: "Taiping Hou Kui", origin: "China", type: "Green", year: 2023 });
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("unsubscribe");
      expect(additionalData).toHaveProperty("ref");
      expect(additionalData.snapshot).toBeInstanceOf(DataSnapshot);
      expect(status).toBe("success");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);

      additionalData.unsubscribe();
    });
    it("should return emptyResource status for non existing resource", async () => {
      const client = new Client({ url: "bees/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      const req = client
        .createRequest<Tea[]>()({
          endpoint: ":teaId",
          method: "onValue",
        })
        .setParams({ teaId: 1 });
      const { data, additionalData, status, isSuccess, error } = await req.send();
      expect(data).toStrictEqual(null);
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("unsubscribe");
      expect(additionalData).toHaveProperty("ref");
      expect(additionalData.snapshot).toBeInstanceOf(DataSnapshot);
      expect(status).toBe("emptyResource");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);

      additionalData.unsubscribe();
    });
    it("should change HF cache if data is changed in firebase after onValue listener creation", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
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
        additionalData: { unsubscribe },
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
  });

  describe("get", () => {
    it("should return data available for endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get",
      });
      const { data, additionalData, status, isSuccess, error } = await req.send();
      expect(data).toHaveLength(10);
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("ref");
      expect(additionalData.snapshot).toBeInstanceOf(DataSnapshot);
      expect(status).toBe("success");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);
    });
    it("should return data for dynamic endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const { data } = await req.send();
      expect(data).toStrictEqual({ amount: 150, name: "Taiping Hou Kui", origin: "China", type: "Green", year: 2023 });
    });
    it("should return emptyResource status for non existing resource", async () => {
      const client = new Client({ url: "bees/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      const req = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const { data, status } = await req.send();
      expect(data).toStrictEqual(null);
      expect(status).toStrictEqual("emptyResource");
    });
  });

  describe("set", () => {
    // TODO - what should set return as data?
    it("should set data", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 10 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
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
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
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

  describe("push", () => {
    it("should allow for adding data to a list", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 100 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
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
      const arrayedData = Object.values(data);

      expect(arrayedData).toHaveLength(11);
      expect(arrayedData[10]).toStrictEqual(newData);
      expect(additionalData).toHaveProperty("key");
    });
  });

  describe("update", () => {
    it("should allow for updating data", async () => {
      const newData = { name: "Pou Ran Do Cha", amount: 100, year: 966 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
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

  describe("remove", () => {
    it("should allow for removing data", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      const getReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const removeReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "remove",
        })
        .setParams({ teaId: 1 });

      await removeReq.send();
      const { data, additionalData } = await getReq.send();
      expect(data).toBe(null);
      expect(additionalData.snapshot.exists()).toBe(false);
    });
  });
});
