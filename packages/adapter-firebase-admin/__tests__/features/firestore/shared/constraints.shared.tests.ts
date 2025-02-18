import { Client } from "@hyper-fetch/core";

import { FirestoreAdapterType } from "adapter";
import { $limit, $orderBy, $where } from "constraints";
import { Tea } from "../../../utils";

export const constraintsSharedTestCases = (client: Client<Error, FirestoreAdapterType>) => {
  describe("filtering", () => {
    it("should return filtered data based on single filter", async () => {
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({ queryParams: { constraints: [$where("type", "==", "Green")] } });
      expect(data).toHaveLength(3);
      expect(data.map((tea) => tea.type)).toStrictEqual(["Green", "Green", "Green"]);
    });
    it("should return filtered data based on compound AND filter", async () => {
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        queryParams: { constraints: [$where("type", "==", "Green"), $where("amount", ">=", 50)] },
      });
      expect(data).toHaveLength(2);
      expect(data.map((tea) => tea.type)).toStrictEqual(["Green", "Green"]);
    });
  });
  describe("ordering", () => {
    it("should allow for returning ordered data", async () => {
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({ queryParams: { constraints: [$orderBy("year")] } });
      expect(data.map((tea) => tea.year)).toStrictEqual([1980, 2011, 2017, 2021, 2021, 2021, 2022, 2022, 2023, 2023]);
    });
  });
  describe("limiting", () => {
    it("should allow for limiting returned data", async () => {
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({ queryParams: { constraints: [$limit(5)] } });

      expect(data).toHaveLength(5);
    });
  });
  describe("complex contraint", () => {
    it("should allow for filtering, ordering and limiting in the same query", async () => {
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data } = await req.send({
        queryParams: { constraints: [$where("type", "==", "Green"), $orderBy("year"), $limit(1)] },
      });
      expect(data).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { __key, ...rest } = data[0];
      expect(rest).toStrictEqual({
        name: "Hon.yama Sencha",
        type: "Green",
        origin: "Japan",
        amount: 25,
        year: 2021,
      });
    });
  });
};
