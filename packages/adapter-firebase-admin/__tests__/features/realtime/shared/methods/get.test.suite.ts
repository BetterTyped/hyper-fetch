import { Client } from "@hyper-fetch/core";
import type { FirebaseAdminAdapter } from "adapter";

import { testLifecycleEvents } from "../../../../shared/request-events.shared";
import type { Tea } from "../../../../utils";

export const getTestSuite = (adapterFunction: () => ReturnType<typeof FirebaseAdminAdapter>) => {
  describe("get", () => {
    let client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    let clientBees = new Client({ url: "bees/" }).setAdapter(adapterFunction());
    beforeEach(() => {
      clientBees = new Client({ url: "bees/" }).setAdapter(adapterFunction());
      client = new Client({ url: "teas/" }).setAdapter(adapterFunction());
    });

    it("should return data available for endpoint", async () => {
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "get",
      });
      const { data, extra, status, success, error } = await req.send();
      expect(data).toHaveLength(10);
      expect(data![0]).toHaveProperty("__key");
      expect(extra).toHaveProperty("snapshot");
      expect(extra).toHaveProperty("ref");
      expect(status).toBe("success");
      expect(success).toBe(true);
      expect(error).toBe(null);
    });
    it("should return data for dynamic endpoint", async () => {
      const req = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const { data } = await req.send();
      expect(data).toStrictEqual({ amount: 150, name: "Taiping Hou Kui", origin: "China", type: "Green", year: 2023 });
    });
    it("should return emptyResource status for non existing resource", async () => {
      const req = clientBees
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      const { data, status } = await req.send();
      expect(data).toStrictEqual(null);
      expect(status).toStrictEqual("emptyResource");
    });
    it("should use get when the request has no method", async () => {
      const req = client
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
        })
        .setParams({ teaId: 1 });

      const { data, success } = await req.send();
      expect(success).toBe(true);
      expect(data).toStrictEqual({ amount: 150, name: "Taiping Hou Kui", origin: "China", type: "Green", year: 2023 });
    });
    it("should resolve with an error for a method Realtime Database does not have", async () => {
      const req = client.createRequest<{ response: Tea[] }>()({
        endpoint: "",
        method: "getDocs",
      });

      const { data, error, status, success } = await req.send();
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(status).toBe("error");
      expect(success).toBe(false);
    });
    it("should emit lifecycle events", async () => {
      const req = clientBees
        .createRequest<{ response: Tea }>()({
          endpoint: ":teaId",
          method: "get",
        })
        .setParams({ teaId: 1 });

      await testLifecycleEvents(req);
    });
  });
};
