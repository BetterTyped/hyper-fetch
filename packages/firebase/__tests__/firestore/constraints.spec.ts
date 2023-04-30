/**
 * @jest-environment node
 */
import { Client } from "@hyper-fetch/core";
import { where, orderBy, limit } from "firebase/firestore";

import { firebaseAdapter } from "../../src/adapter/adapter.firebase";
import { seedFirestoreDatabase, Tea } from "../utils/seed";
import { firestoreDb } from "./index";
import { deleteCollectionForWeb } from "./utils";
import { params } from "../../src/adapter/utils/params.wrapper";

describe("Firestore [ Constraints ]", () => {
  beforeEach(async () => {
    await seedFirestoreDatabase(firestoreDb);
  });

  afterEach(async () => {
    await deleteCollectionForWeb(firestoreDb, "teas/");
  });

  describe("filtering", () => {
    it("should return filtered data based on single filter", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({ queryParams: { constraints: params([where("type", "==", "Green")]) } });
      expect(data).toHaveLength(3);
      expect(data.map((tea) => tea.type)).toStrictEqual(["Green", "Green", "Green"]);
    });
    it("should return filtered data based on compound AND filter", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        queryParams: { constraints: params([where("type", "==", "Green"), where("amount", ">=", 50)]) },
      });
      expect(data).toHaveLength(2);
      expect(data.map((tea) => tea.type)).toStrictEqual(["Green", "Green"]);
    });
  });
  describe("ordering", () => {
    it("should allow for returning ordered data", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({ queryParams: { constraints: params([orderBy("year")]) } });
      expect(data.map((tea) => tea.year)).toStrictEqual([1980, 2011, 2017, 2021, 2021, 2021, 2022, 2022, 2023, 2023]);
    });
  });
  describe("limiting", () => {
    it("should allow for limiting returned data", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({ queryParams: { constraints: params([limit(5)]) } });
      expect(data).toHaveLength(5);
    });
  });

  describe("complex contraint", () => {
    it("should allow for filtering, ordering and limiting in the same query", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(firestoreDb));
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        queryParams: { constraints: params([where("type", "==", "Green"), orderBy("year"), limit(1)]) },
      });
      expect(data).toHaveLength(1);
      expect(data[0]).toStrictEqual({
        name: "Hon.yama Sencha",
        type: "Green",
        origin: "Japan",
        amount: 25,
        year: 2021,
      });
    });
  });
});
