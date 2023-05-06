import { ref, set } from "firebase/database";
import { Client } from "@hyper-fetch/core";

import { realtimeDbWeb } from "./initialize.web";
import { firebaseWebAdapter } from "adapter";
import { seedRealtimeDatabaseWeb } from "../../utils/seed.web";
import { Tea } from "../../utils/seed.data";
import { $endAt, $limitToFirst, $orderByChild, $startAt } from "constraints";

describe("Realtime Database Web [Constraints]", () => {
  beforeEach(async () => {
    await set(ref(realtimeDbWeb, "teas/"), null);
    await seedRealtimeDatabaseWeb(realtimeDbWeb);
  });

  describe("Ordering", () => {
    it("Should allow ordering by child", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get",
      });
      const { data } = await req.send({
        queryParams: { constraints: [$orderByChild("origin")] },
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
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get",
      });
      const { data } = await req.send({
        queryParams: { constraints: [$orderByChild("origin"), $limitToFirst(5)] },
      });
      expect(data.map((tea) => tea.origin)).toStrictEqual(["China", "China", "China", "China", "China"]);
    });
    it("Should allow to combine multiple filterings", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(() => firebaseWebAdapter(realtimeDbWeb));
      // TODO - I am not sure that we should return additionalData by default, at least snapshot - it results in larger requests.
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get",
      });
      const { data } = await req.send({
        queryParams: { constraints: [$orderByChild("year"), $startAt(2021), $endAt(2022)] },
      });
      expect(data).toHaveLength(5);
      expect(data.map((tea) => tea.year)).toStrictEqual([2021, 2021, 2021, 2022, 2022]);
    });
  });
});
