import { Client } from "@hyper-fetch/core";

import { FirebaseAdapter } from "adapter";
import { Tea } from "../../../../utils";
import { testLifecycleEvents } from "../../../../shared/request-events.shared";

export const getDocTestSuite = (adapterFunction: () => ReturnType<typeof FirebaseAdapter>) => {
  describe("getDoc", () => {
    it("should return data available for endpoint", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const req = client
        .createRequest<{ response: Tea[] }>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });
      const { data, extra, status, success, error } = await req.send();
      expect(data).toStrictEqual({
        amount: 150,
        name: "Taiping Hou Kui",
        origin: "China",
        type: "Green",
        year: 2023,
        __key: "1",
      });
      expect(extra).toHaveProperty("snapshot");
      expect(extra).toHaveProperty("ref");
      expect(status).toBe("success");
      expect(success).toBe(true);
      expect(error).toBe(null);
    });
    it("should return emptyResource status for non existing resource", async () => {
      const client = new Client({ url: "bees/" }).setAdapter(adapterFunction());
      const req = client
        .createRequest<{ response: Tea[] }>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });
      const { data, extra, status, success, error } = await req.send();
      expect(data).toStrictEqual(null);
      expect(extra).toHaveProperty("snapshot");
      expect(extra).toHaveProperty("ref");
      expect(status).toBe("emptyResource");
      expect(success).toBe(true);
      expect(error).toBe(null);
    });
    it("should emit lifecycle events", async () => {
      const client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
      const request = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "getDoc",
        })
        .setParams({ teaId: 1 });

      await testLifecycleEvents(request);
    });
  });
};
