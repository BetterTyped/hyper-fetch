/**
 * @jest-environment node
 */
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Client, getAdapterHeaders, getAdapterPayload } from "client";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Client [ SSR ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: any; payload: FormData }>()({ endpoint: "shared-nase-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: any; payload: FormData }>()({ endpoint: "shared-nase-endpoint" });
    resetMocks();
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
