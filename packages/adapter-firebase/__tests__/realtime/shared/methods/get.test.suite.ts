import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter, firebaseWebAdapter } from "../../../../src";
import { Tea } from "../../../utils/seed.data";

export const getTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseWebAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("get", () => {
    it("should return data available for endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get",
      });
      const { data, additionalData, status, isSuccess, error } = await req.send();
      expect(data).toHaveLength(10);
      expect(additionalData).toHaveProperty("snapshot");
      expect(additionalData).toHaveProperty("ref");
      expect(status).toBe("success");
      expect(isSuccess).toBe(true);
      expect(error).toBe(null);
    });
    it("should return data for dynamic endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
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
      const client = new Client({ url: "bees/" }).setAdapter(adapterFunction);
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
};
