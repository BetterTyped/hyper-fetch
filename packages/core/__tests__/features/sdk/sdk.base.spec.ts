import { Client } from "client";
import { createSdk } from "sdk";

describe("SDK [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
  });

  it("should create sdk", async () => {
    const schema = {
      file: {
        post: {
          endpoint: "/api/files",
          method: "POST",
          queued: true,
          retry: 0,
        },
      },
    };

    const mySdk = createSdk(client, ({ path, args }) => {
      if (schema[path[0]]) {
        return client.createRequest()({ ...schema[path[0]], ...args });
      }
      throw new Error(`Request ${path[0]} not found in schema`);
    });

    expect(mySdk.file.post).toBeDefined();
    expect(mySdk.file.post).toBeInstanceOf(Request);
  });
});
