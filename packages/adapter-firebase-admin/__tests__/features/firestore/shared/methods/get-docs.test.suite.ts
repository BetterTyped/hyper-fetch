import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter } from "adapter";
import { Tea } from "../../../../utils";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";

export const getDocsTestSuite = (adapterFunction: () => ReturnType<typeof firebaseAdminAdapter>) => {
  describe("getDocs", () => {
    it("should return data available for endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data, extra, status, success, error } = await req.send();
      expect(data).toHaveLength(10);
      expect(extra).toHaveProperty("snapshot");
      expect(extra).toHaveProperty("ref");
      expect(status).toBe("success");
      expect(success).toBe(true);
      expect(error).toBe(null);
    });
    it("should return emptyResource status for non existing resource", async () => {
      const client = new Client({ url: "bees/" }).setAdapter(adapterFunction());
      const req = client.createRequest<Tea[]>()({
        endpoint: "",
        method: "getDocs",
      });
      const { data, status, success, error } = await req.send();
      expect(data).toStrictEqual(null);
      expect(status).toBe("emptyResource");
      expect(success).toBe(true);
      expect(error).toBe(null);
    });
    it("should emit lifecycle events", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const request = client.createRequest<Tea>()({
        endpoint: "",
        method: "getDocs",
      });

      await testLifecycleEvents(request);
    });
  });
};
