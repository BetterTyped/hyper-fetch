import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter, firebaseBrowserAdapter } from "../../../../src";
import { testLifecycleEvents } from "../../../shared/request-events.shared";
import { Tea } from "../../../utils/seed.data";

export const getTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseBrowserAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("get", () => {
    let client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
    let clientBees = new Client({ url: "bees/" }).setAdapter(adapterFunction);
    beforeEach(() => {
      clientBees = new Client({ url: "bees/" }).setAdapter(adapterFunction);
      client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
    });

    it("should return data available for endpoint", async () => {
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "get",
      });
      const { data, extra, status, success, error } = await req.send();
      expect(data).toHaveLength(10);
      expect(extra).toHaveProperty("snapshot");
      expect(extra).toHaveProperty("ref");
      expect(status).toBe("success");
      expect(success).toBe(true);
      expect(error).toBe(null);
    });
    it("should return data for dynamic endpoint", async () => {
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
      const req = clientBees
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const { data, status } = await req.send();
      expect(data).toStrictEqual(null);
      expect(status).toStrictEqual("emptyResource");
    });
    it("should emit lifecycle events", async () => {
      const req = clientBees
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      await testLifecycleEvents(req);
    });
  });
};
