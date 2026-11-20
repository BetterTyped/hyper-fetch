import type { Client } from "@hyper-fetch/core";
import type { FirestoreAdapterType, FirestoreQueryParams } from "adapter";
import { $endAt, $endBefore, $limit, $orderBy, $startAfter, $startAt, $where } from "constraints";

import type { Tea } from "../../../utils";

export const constraintsSharedTestCases = (client: Client<Error, FirestoreAdapterType>) => {
  describe("filtering", () => {
    it("should return filtered data based on single filter", async () => {
      const req = client.createRequest<{ response: Tea[]; queryParams: FirestoreQueryParams }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({ queryParams: [$where("type", "==", "Green")] });
      expect(data).toHaveLength(3);
      expect(data?.map((tea) => tea.type)).toStrictEqual(["Green", "Green", "Green"]);
    });
    it("should return filtered data based on compound AND filter", async () => {
      const req = client.createRequest<{ response: Tea[]; queryParams: FirestoreQueryParams }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        queryParams: [$where("type", "==", "Green"), $where("amount", ">=", 50)],
      });
      expect(data).toHaveLength(2);
      expect(data?.map((tea) => tea.type)).toStrictEqual(["Green", "Green"]);
    });
  });
  describe("ordering", () => {
    it("should allow for returning ordered data", async () => {
      const req = client.createRequest<{ response: Tea[]; queryParams: FirestoreQueryParams }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({ queryParams: [$orderBy("year")] });
      expect(data?.map((tea) => tea.year)).toStrictEqual([1980, 2011, 2017, 2021, 2021, 2021, 2022, 2022, 2023, 2023]);
    });
  });
  describe("limiting", () => {
    it("should allow for limiting returned data", async () => {
      const req = client.createRequest<{ response: Tea[]; queryParams: FirestoreQueryParams }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({ queryParams: [$limit(5)] });

      expect(data).toHaveLength(5);
    });
  });
  describe("complex contraint", () => {
    it("should allow for filtering, ordering and limiting in the same query", async () => {
      const req = client.createRequest<{ response: Tea[]; queryParams: FirestoreQueryParams }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        queryParams: [$where("type", "==", "Green"), $orderBy("year"), $limit(1)],
      });
      expect(data).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { __key, ...rest } = data?.[0] || {};
      expect(rest).toStrictEqual({
        name: "Hon.yama Sencha",
        type: "Green",
        origin: "Japan",
        amount: 25,
        year: 2021,
      });
    });
  });
  describe("cursors", () => {
    it("should start and end the ordered query at field values", async () => {
      const req = client.createRequest<{ response: Tea[]; queryParams: FirestoreQueryParams }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data: fromStart } = await req.send({
        queryParams: [$orderBy("year"), $startAt(2022)],
      });
      const { data: afterStart } = await req.send({
        queryParams: [$orderBy("year"), $startAfter(2022)],
      });
      const { data: toEnd } = await req.send({
        queryParams: [$orderBy("year"), $endAt(2011)],
      });
      const { data: beforeEnd } = await req.send({
        queryParams: [$orderBy("year"), $endBefore(2011)],
      });

      expect(fromStart?.map((tea) => tea.year)).toStrictEqual([2022, 2022, 2023, 2023]);
      expect(afterStart?.map((tea) => tea.year)).toStrictEqual([2023, 2023]);
      expect(toEnd?.map((tea) => tea.year)).toStrictEqual([1980, 2011]);
      expect(beforeEnd?.map((tea) => tea.year)).toStrictEqual([1980]);
    });
    it("should pass every cursor value when ordering by multiple fields", async () => {
      const req = client.createRequest<{ response: Tea[]; queryParams: FirestoreQueryParams }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        queryParams: [$orderBy("year"), $orderBy("name"), $startAfter(2023, "Hong Yu")],
      });

      expect(data?.map((tea) => tea.name)).toStrictEqual(["Taiping Hou Kui"]);
    });
  });
};
