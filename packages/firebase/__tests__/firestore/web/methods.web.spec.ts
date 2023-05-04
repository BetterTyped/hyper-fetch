/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { DocumentSnapshot, QuerySnapshot } from "firebase/firestore";

import { firebaseWebAdapter } from "../../../src/adapter/adapter.firebase.web";
import { firestoreDbWeb } from "./initialize.web";
import { seedFirestoreDatabaseWeb } from "../../utils/seed.web";
import { Tea } from "../../utils/seed.data";
import { deleteCollectionForWeb } from "../../utils/clean.web";
import { $where } from "../../../src/adapter/constraints/constraints.firebase";

describe("Firestore Web [ Methods ]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabaseWeb(firestoreDbWeb);
  });

  afterEach(async () => {
    await deleteCollectionForWeb(firestoreDbWeb, "teas/");
  });

  describe("onSnapshot", () => {
    it("should return data available for collection", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "onSnapshot",
      });

      const { data, additionalData, status, isSuccess, error } = await req.send();

      expect(data).toHaveLength(10);
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("unsubscribe");
      expect(additionalData).toHaveProperty("ref");
      // TODO check if querysnapshot in types
      expect(additionalData.snapshot).toBeInstanceOf(QuerySnapshot);
      expect(status).toBe("success");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);

      additionalData.unsubscribe();
    });
    it("should return data available for doc", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
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
    it("should return emptyResource status for non existing resource", async () => {
      const client = new Client({ url: "bees/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
      const req = client
        .createRequest<Tea[]>()({
          endpoint: ":teaId",
          method: "onSnapshot",
        })
        .setParams({ teaId: 1 });
      const { data, additionalData, status, isSuccess, error } = await req.send();

      expect(data).toStrictEqual(null);
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("unsubscribe");
      expect(additionalData).toHaveProperty("ref");
      expect(additionalData.snapshot).toBeInstanceOf(DocumentSnapshot);
      expect(status).toBe("emptyResource");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);

      additionalData.unsubscribe();
    });
    it("should allow for listening to multiple documents and change HF cache if data is changed in firebase after onSnapshot listener creation", async () => {
      const cacheKey = "onSnapshot_?constraints[]=where_type%3D%3DGreen";
      const initialCache = [
        {
          amount: 50,
          year: 2022,
          origin: "China",
          name: "Bi Luo Chun",
          type: "Green",
        },
        {
          amount: 150,
          year: 2023,
          origin: "China",
          name: "Taiping Hou Kui",
          type: "Green",
        },
        {
          amount: 25,
          year: 2021,
          origin: "Japan",
          name: "Hon.yama Sencha",
          type: "Green",
        },
      ];
      const newData = {
        origin: "Poland",
        type: "Green",
        year: 2043,
        name: "Pou Ran Do Cha",
        amount: 100,
      };
      const afterUpdateCache = [...initialCache, newData];
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
      const onSnapshotReq = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "onSnapshot",
      });
      // Should listen for changes only for Green teas
      const {
        additionalData: { unsubscribe },
      } = await onSnapshotReq.send({ queryParams: { constraints: [$where("type", "==", "Green")] } });

      const afterOnSnapshotCache = onSnapshotReq.client.cache.get(cacheKey);

      const shouldCacheData = newData as Tea;
      const shouldNotCacheData = {
        ...newData,
        type: "Oolong",
      } as Tea;

      const shouldCacheAddDocRequest = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "addDoc",
        })
        .setData(shouldCacheData);
      const shouldNotCacheAddDocRequest = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "addDoc",
        })
        .setData(shouldNotCacheData);

      await shouldCacheAddDocRequest.send();
      await shouldNotCacheAddDocRequest.send();

      const { data: afterAddDocCache } = onSnapshotReq.client.cache.get(cacheKey);

      if (unsubscribe) {
        unsubscribe();
      }

      await shouldCacheAddDocRequest.send();

      const { data: afterUnsubCache } = onSnapshotReq.client.cache.get(cacheKey);

      expect(afterOnSnapshotCache.data).toStrictEqual(initialCache);
      expect(afterAddDocCache).toStrictEqual(afterUpdateCache);
      expect(afterUnsubCache).toStrictEqual(afterUpdateCache);
    });
  });

  describe("getDoc", () => {
    it("should return data available for endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
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
    it("should return emptyResource status for non existing resource", async () => {
      const client = new Client({ url: "bees/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client
        .createRequest<Tea[]>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });
      const { data, additionalData, status, isSuccess, error } = await req.send();
      expect(data).toStrictEqual(null);
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("ref");
      expect(additionalData.snapshot).toBeInstanceOf(DocumentSnapshot);
      expect(status).toBe("emptyResource");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);
    });
  });

  describe("getDocs", () => {
    it("should return data available for endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
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
    it("should return emptyResource status for non existing resource", async () => {
      const client = new Client({ url: "bees/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data, status, isSuccess, error } = await req.send();
      expect(data).toStrictEqual(null);
      expect(status).toBe("emptyResource");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);
    });
  });

  describe("setDoc", () => {
    it("should set data", async () => {
      const newData = { origin: "Poland", type: "Green", year: 2023, name: "Pou Ran Do Cha", amount: 10 } as Tea;
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
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
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
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
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
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
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(firestoreDbWeb));
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