import { Client } from "@hyper-fetch/core";

import { $endAt, $limitToFirst, $orderByChild, $startAt, FirebaseAdminAdapter } from "../../../../src";
import { Tea } from "../../../utils";

export const constraintsSharedTestCases = (adapterFunction: () => ReturnType<typeof FirebaseAdminAdapter>) => {
  describe("Ordering", () => {
    it("Should allow ordering by child", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        // TODO: Fix this
        queryParams: { constraints: [$orderByChild("origin")] },
      });
      expect(data?.map((el) => el.origin)).toStrictEqual([
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
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        // TODO: Fix this
        queryParams: { constraints: [$orderByChild("origin"), $limitToFirst(5)] },
      });
      expect(data?.map((tea) => tea.origin)).toStrictEqual(["China", "China", "China", "China", "China"]);
    });
    it("Should allow to combine multiple filters", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        // TODO: Fix this
        queryParams: { constraints: [$orderByChild("year"), $startAt(2021), $endAt(2022)] },
      });
      expect(data).toHaveLength(5);
      expect(data?.map((tea) => tea.year)).toStrictEqual([2021, 2021, 2021, 2022, 2022]);
    });
  });
};
