import { Client } from "@hyper-fetch/core";
import type { FirebaseAdapter, RealtimeDBQueryParams } from "adapter";
import { $endAt, $limitToFirst, $orderByChild, $startAfter, $startAt } from "constraints";

import type { Tea } from "../../../utils";

export const constraintsSharedTestCases = (adapterFunction: () => ReturnType<typeof FirebaseAdapter>) => {
  describe("Ordering", () => {
    it("Should allow ordering by child", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "get",
      });
      const { data } = await req.send({
        queryParams: [$orderByChild("origin")],
      });
      expect(data!.map((el) => el.origin)).toStrictEqual([
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
        method: "get",
      });
      const { data } = await req.send({
        queryParams: [$orderByChild("origin"), $limitToFirst(5)],
      });
      expect(data!.map((tea) => tea.origin)).toStrictEqual(["China", "China", "China", "China", "China"]);
    });
    it("Should allow to combine multiple filters", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "get",
      });
      const { data } = await req.send({
        queryParams: [$orderByChild("year"), $startAt(2021), $endAt(2022)],
      });
      expect(data).toHaveLength(5);
      expect(data!.map((tea) => tea.year)).toStrictEqual([2021, 2021, 2021, 2022, 2022]);
    });
    it("Should pass the key to cursors as the tie-breaker", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "get",
      });
      const { data } = await req.send({
        queryParams: [$orderByChild("year"), $startAfter(2022, "0")],
      });
      expect(data?.map((tea) => tea.name)).toStrictEqual(["Yunnan Golden Silk", "Taiping Hou Kui", "Hong Yu"]);
    });
  });
  describe("constraints callback", () => {
    it("should order, filter and page with a callback", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<{ response: Tea[]; queryParams?: RealtimeDBQueryParams<Tea> }>()({
        endpoint: "",
        method: "get",
      });

      const { data: page } = await req.send({ queryParams: (c) => c.orderByChild("year").startAfter(2022, "0") });
      const { data: green } = await req.send({ queryParams: (c) => c.orderByChild("year").equalTo(2023) });
      const { data: last } = await req.send({ queryParams: (c) => c.orderByChild("year").limitToLast(1) });

      expect(page?.map((tea) => tea.name)).toStrictEqual(["Yunnan Golden Silk", "Taiping Hou Kui", "Hong Yu"]);
      expect(green?.map((tea) => tea.name)).toStrictEqual(["Taiping Hou Kui", "Hong Yu"]);
      expect(last?.map((tea) => tea.year)).toStrictEqual([2023]);
    });
    it("should break equalTo ties with the key", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<{ response: Tea[]; queryParams?: RealtimeDBQueryParams<Tea> }>()({
        endpoint: "",
        method: "get",
      });

      const { data } = await req.send({ queryParams: (c) => c.orderByChild("year").equalTo(2023, "4") });

      expect(data?.map((tea) => tea.name)).toStrictEqual(["Hong Yu"]);
    });
    it("should keep the deprecated constraints object working", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<{ response: Tea[]; queryParams?: RealtimeDBQueryParams<Tea> }>()({
        endpoint: "",
        method: "get",
      });

      const { data } = await req.send({ queryParams: { constraints: [$orderByChild("year"), $limitToFirst(2)] } });

      expect(data?.map((tea) => tea.year)).toStrictEqual([1980, 2011]);
    });
  });
};
