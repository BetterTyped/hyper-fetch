/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { DocumentSnapshot, QuerySnapshot } from "firebase/firestore";

import { firebaseAdapter } from "../../src/adapter/adapter.firebase";
import { seedFirestoreDatabase, Tea } from "../utils/seed";
import { firestoreDb } from "./index";
import { deleteCollectionForWeb } from "./utils";

describe("Firestore [ Methods ]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabase(firestoreDb);
  });

  afterEach(async () => {
    await deleteCollectionForWeb(firestoreDb, "teas/");
  });

  describe("onSnapshot", () => {
    it("should return data available for endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      const req = client
        .createRequest<Tea[]>()({
          endpoint: ":teaId",
          method: "onSnapshot",
        })
        .setParams({ teaId: 1 });
      const { data, additionalData, status, isSuccess, error } = await req.send();

      expect(data).toStrictEqual({ amount: 150, name: "Taiping Hou Kui", origin: "China", type: "Green", year: 2023 });
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("unsubscribe");
      expect(additionalData).toHaveProperty("ref");
      expect(additionalData.snapshot).toBeInstanceOf(DocumentSnapshot);
      expect(status).toBe("success");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);

      additionalData.unsubscribe();
    });
    // it("should change HF cache if data is changed in firebase after onSnapshot listener creation", async () => {
    //   const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
    //   const onValueReq = client
    //     .createRequest<Tea[]>()({
    //       endpoint: ":teaId",
    //       method: "onValue",
    //     })
    //     .setParams({ teaId: 1 });
    //   const newData = { origin: "Poland", type: "Green", year: 2043, name: "Pou Ran Do Cha", amount: 100 } as Tea;
    //   const pushReq = client
    //     .createRequest<Tea, Tea>()({
    //       endpoint: "",
    //       method: "push",
    //     })
    //     .setData(newData);
    //   const {
    //     data,
    //     additionalData: { unsubscribe },
    //   } = await onValueReq.send();
    //
    //   const { data: cacheAfterOnValue } = onValueReq.client.cache.get(onValueReq.cacheKey);
    //
    //   await pushReq.send();
    //
    //   const { data: cacheAfterPush } = onValueReq.client.cache.get(onValueReq.cacheKey);
    //
    //   if (unsubscribe) {
    //     unsubscribe();
    //   }
    //
    //   await pushReq.send();
    //
    //   const { data: cacheAfterUnsub } = onValueReq.client.cache.get(onValueReq.cacheKey);
    //
    //   expect(data).toStrictEqual(cacheAfterOnValue);
    //   expect(Object.values(cacheAfterPush)).toHaveLength(11);
    //   expect(Object.values(cacheAfterUnsub)).toHaveLength(11);
    // });
  });

  describe("getDoc", () => {
    it("should return data available for endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client
        .createRequest<Tea[]>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });
      const { data, additionalData, status, isSuccess, error } = await req.send();
      expect(data).toStrictEqual({ amount: 150, name: "Taiping Hou Kui", origin: "China", type: "Green", year: 2023 });
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("ref");
      expect(additionalData.snapshot).toBeInstanceOf(DocumentSnapshot);
      expect(status).toBe("success");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);
    });
  });

  describe("getDocs", () => {
    it("should return data available for endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data, additionalData, status, isSuccess, error } = await req.send();
      expect(data).toHaveLength(10);
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("ref");
      expect(additionalData.snapshot).toBeInstanceOf(QuerySnapshot);
      expect(status).toBe("success");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);
    });
  });

  describe("setDoc", () => {
    // TODO - what should set return as data?
    it("should set data", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 10 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
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
      const { data, additionalData } = await getReq.send();

      expect(data).toStrictEqual(newData);
      expect(additionalData.snapshot.exists()).toBe(true);
    });
  });

  describe("addDoc", () => {
    it("should allow for adding data to a list", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 100 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
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
      expect(arrayedData[10]).toStrictEqual(newData);
    });
  });

  describe("updateDoc", () => {
    // TODO add test for nested fields update
    // TODO add test for elements in the array update
    // TODO add test for deleting a field
    it("should allow for updating data", async () => {
      const newData = { name: "Pou Ran Do Cha", amount: 100, year: 966 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      const updateReq = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "updateDoc",
        })
        .setData(newData);
      const getReq = client.createRequest<Tea>()({
        endpoint: ":teaId",
        method: "getDoc",
      });
      await updateReq.send({ params: { teaId: 1 } });
      // TODO - if we do not pass any params even if the endpoint technically requires them - it still passes. Should we throw error?
      const { data } = await getReq.send({ params: { teaId: 1 } });
      expect(data).toStrictEqual({ ...newData, origin: "China", type: "Green" });
    });
  });

  describe("deleteDoc", () => {
    it("should allow for removing data", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      const getReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });

      const removeReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "deleteDoc",
        })
        .setParams({ teaId: 1 });

      const { data: beforeRemoval } = await getReq.send();
      await removeReq.send();
      const { data, additionalData } = await getReq.send();
      expect(beforeRemoval).toStrictEqual({
        amount: 150,
        year: 2023,
        origin: "China",
        name: "Taiping Hou Kui",
        type: "Green",
      });
      expect(data).toBe(undefined);
      expect(additionalData.snapshot.exists()).toBe(false);
    });
  });
});
