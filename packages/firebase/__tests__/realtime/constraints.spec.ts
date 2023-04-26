import { ref, set, orderByChild, limitToFirst, startAt, endAt } from "firebase/database";
import { Client } from "@hyper-fetch/core";

import { seedRealtimeDatabase, Tea } from "../utils/seed";
import { db } from "./index";
import { firebaseAdapter } from "../../src/adapter/adapter.firebase";

describe("[Realtime Database] Constraints", () => {
  beforeEach(async () => {
    await set(ref(db, "teas/"), null);
    await seedRealtimeDatabase(db);
  });

  describe("Ordering", () => {
    it("Should allow ordering by child", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(db));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get",
      });
      const { data } = await req.send({
        queryParams: { orderBy: orderByChild("origin") },
      });
      expect(data.map((el) => el.origin)).toStrictEqual([
        "China",
        "China",
        "China",
        "China",
        "China",
        "China",
        "China",
        "Japan",
        "Taiwan",
        "Taiwan",
      ]);
    });
  });
  describe("Filtering and ordering", () => {
    it("Should allow to limit the result and order it", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(db));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get", // shows RealtimeDBMethods | FirestoreDBMethods type - need to fix to show only one
      });
      const { data } = await req.send({
        queryParams: { orderBy: orderByChild("origin"), filterBy: [limitToFirst(5)] },
      });
      expect(data.map((tea) => tea.origin)).toStrictEqual(["China", "China", "China", "China", "China"]);
    });
    it("Should allow to combine multiple filterings", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseAdapter(db));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get", // shows RealtimeDBMethods | FirestoreDBMethods type - need to fix to show only one
      });
      const { data } = await req.send({
        queryParams: { orderBy: orderByChild("year"), filterBy: [startAt(2021), endAt(2022)] },
      });
      expect(data).toHaveLength(5);
      expect(data.map((tea) => tea.year)).toStrictEqual([2021, 2021, 2021, 2022, 2022]);
    });
  });
});
