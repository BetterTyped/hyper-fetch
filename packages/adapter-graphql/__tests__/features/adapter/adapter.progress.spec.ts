import { Client } from "@hyper-fetch/core";
import { GraphqlAdapter } from "adapter";

const url = "https://shared-base-url/graphql";
const getUsers = "query GetUsers { users { name } }";

/** Fetch has no upload events - only the response shows that the whole body was sent. */
describe("Graphql Adapter [ Progress ]", () => {
  let client = new Client({ url }).setAdapter(GraphqlAdapter());
  let fetchSpy = vi.spyOn(globalThis, "fetch");
  let bodySent = false;

  beforeEach(() => {
    bodySent = false;
    client = new Client({ url }).setAdapter(GraphqlAdapter());
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      bodySent = true;
      return Response.json({ data: { users: [] } });
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should report the finished upload only once the body was sent", async () => {
    const progress: { loaded: number; total: number; bodySent: boolean }[] = [];
    const size = new Blob([JSON.stringify({ query: getUsers, operationName: "GetUsers" })]).size;

    await client
      .createRequest()({ endpoint: getUsers })
      .send({ onUploadProgress: ({ loaded, total }) => progress.push({ loaded, total, bodySent }) });

    expect(progress).toStrictEqual([
      { loaded: 0, total: size, bodySent: false },
      { loaded: size, total: size, bodySent: true },
    ]);
  });
});
