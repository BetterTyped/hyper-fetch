/**
 * @jest-environment node
 */
import { Client, getAdapterHeaders, getAdapterPayload } from "client";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Client [ SSR ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<any, FormData>()({ endpoint: "shared-nase-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<any, FormData>()({ endpoint: "shared-nase-endpoint" });
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using getAdapterHeaders util", () => {
    it("should allow to stringify payload", async () => {
      expect(() => getAdapterHeaders(request)).not.toThrow();
    });
  });

  describe("When using getAdapterPayload util", () => {
    it("should allow to stringify payload", async () => {
      const data = { data: [] };

      expect(() => getAdapterPayload(data)).not.toThrow();
    });
  });
});
