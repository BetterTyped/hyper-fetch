/**
 * @vitest-environment node
 */
import { createClient, getErrorMessage, getRequestDispatcher } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { http, HttpResponse } from "msw";

import type { OrpcAdapterOptionsType } from "../../../src/adapter";
import { OrpcAdapter } from "../../../src/adapter";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const url = "http://localhost:3000/rpc";

type User = { id: number; name: string };

const notFound = { defined: true, code: "NOT_FOUND", status: 404, message: "User not found", data: { id: 1 } };

/** Money is sent as a `[currency, cents]` pair */
class Money {
  constructor(
    public currency: string,
    public cents: number,
  ) {}
}

const moneySerializer: NonNullable<OrpcAdapterOptionsType["customJsonSerializers"]>[number] = {
  type: 21,
  condition: (value) => value instanceof Money,
  serialize: (value: Money) => [value.currency, value.cents],
  deserialize: ([currency, cents]: [string, number]) => new Money(currency, cents),
};

describe("Orpc Adapter [ Fetch ]", () => {
  let client = createClient({ url }).setAdapter(OrpcAdapter());

  const createQuery = () =>
    client.createRequest<{ response: User; payload: { id: number } }>()({ endpoint: "user/byId", method: "QUERY" });
  const createMutation = () =>
    client.createRequest<{ response: User; payload: { name: string } }>()({
      endpoint: "user/create",
      method: "MUTATION",
    });

  /** Captures the request that reached the network */
  const captureRequest = (method: "get" | "post", procedure: string, body?: unknown) => {
    const captured: { current: Request | null; body: string; form: FormData | null } = {
      current: null,
      body: "",
      form: null,
    };

    server.use(
      http[method](`${url}/${procedure}`, async ({ request }) => {
        captured.current = request.clone();
        if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
          captured.form = await request.formData();
        } else {
          captured.body = await request.text();
        }
        return HttpResponse.json((body ?? { json: null }) as Record<string, unknown>);
      }),
    );

    return captured;
  };

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient({ url }).setAdapter(OrpcAdapter());
  });

  afterEach(() => {
    resetMocks();
    client.clear();
  });

  afterAll(() => {
    stopServer();
  });

  describe("when sending a query", () => {
    it("should use QUERY as the default method", () => {
      expect(client.createRequest()({ endpoint: "health" }).method).toBe("QUERY");
    });

    it("should use the fetch dispatcher and deduplicate by default", () => {
      const request = createQuery();

      expect(getRequestDispatcher(request)[1]).toBe(true);
      expect(request.deduplicate).toBe(true);
    });

    it("should send a POST request with the serialized input by default", async () => {
      const captured = captureRequest("post", "user/byId");

      await createQuery().setPayload({ id: 1 }).send();

      expect(captured.current?.method).toBe("POST");
      expect(captured.current?.url).toBe(`${url}/user/byId`);
      expect(captured.current?.headers.get("content-type")).toBe("application/json");
      expect(captured.body).toBe('{"json":{"id":1}}');
    });

    it("should map the output to the response", async () => {
      const user = { id: 1, name: "John" };
      captureRequest("post", "user/byId", { json: user });

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.data).toStrictEqual(user);
      expect(response.error).toBeNull();
      expect(response.status).toBe(200);
      expect(response.success).toBe(true);
      expect(response.extra?.headers["content-type"]).toContain("application/json");
    });

    it("should apply the request payload mapper before encoding", async () => {
      const captured = captureRequest("post", "user/byId");

      await createQuery()
        .setPayload({ id: 1 })
        .setPayloadMapper((payload) => ({ id: (payload?.id ?? 0) + 1 }))
        .send();

      expect(captured.body).toBe('{"json":{"id":2}}');
    });
  });

  describe("when sending a query with GET", () => {
    beforeEach(() => {
      client = createClient({ url }).setAdapter(OrpcAdapter({ queryMethod: "GET" }));
    });

    it("should send the serialized input in the data query param", async () => {
      const captured = captureRequest("get", "user/byId");

      await createQuery().setPayload({ id: 1 }).send();

      expect(captured.current?.method).toBe("GET");
      expect(new URL(captured.current?.url as string).searchParams.get("data")).toBe('{"json":{"id":1}}');
      expect(captured.current?.headers.get("content-type")).toBeNull();
    });

    it("should send the query params next to the input", async () => {
      const captured = captureRequest("get", "user/list");

      await client
        .createRequest<{ response: User[]; payload: { page: number }; queryParams: { source: string } }>()({
          endpoint: "user/list",
        })
        .setPayload({ page: 2 })
        .setQueryParams({ source: "app" })
        .send();

      const data = encodeURIComponent('{"json":{"page":2}}');
      expect(captured.current?.url).toBe(`${url}/user/list?source=app&data=${data}`);
    });

    it("should let a request use POST", async () => {
      const captured = captureRequest("post", "user/byId");

      await createQuery().setPayload({ id: 1 }).setOptions({ queryMethod: "POST" }).send();

      expect(captured.current?.method).toBe("POST");
    });

    it("should send mutations with POST", async () => {
      const captured = captureRequest("post", "user/create");

      await createMutation().setPayload({ name: "John" }).send();

      expect(captured.current?.method).toBe("POST");
      expect(captured.body).toBe('{"json":{"name":"John"}}');
    });
  });

  describe("when a request opts into GET", () => {
    it("should send only that request with GET", async () => {
      const get = captureRequest("get", "user/byId");

      await createQuery().setPayload({ id: 1 }).setOptions({ queryMethod: "GET" }).send();

      expect(get.current?.method).toBe("GET");
    });
  });

  describe("when sending a mutation", () => {
    it("should use the submit dispatcher and not deduplicate by default", () => {
      const request = createMutation();

      expect(getRequestDispatcher(request)[1]).toBe(false);
      expect(request.deduplicate).toBe(false);
    });

    it("should send an empty object without an input", async () => {
      const captured = captureRequest("post", "user/reset");

      await client.createRequest()({ endpoint: "user/reset", method: "MUTATION" }).send();

      expect(captured.current?.headers.get("content-type")).toBe("application/json");
      expect(captured.body).toBe("{}");
    });

    it("should report the upload progress with the size of the body", async () => {
      captureRequest("post", "user/create");
      const onUploadProgress = vi.fn();

      await createMutation().setPayload({ name: "Józef" }).send({ onUploadProgress });

      const size = new Blob(['{"json":{"name":"Józef"}}']).size;
      expect(onUploadProgress).toHaveBeenCalledWith(expect.objectContaining({ total: size, loaded: size }));
    });
  });

  describe("when sending files", () => {
    it("should send a multipart body with the files", async () => {
      const captured = captureRequest("post", "files/upload");
      const file = new File(["file content"], "notes.txt", { type: "text/plain" });

      await client
        .createRequest<{ response: null; payload: { name: string; file: File } }>()({
          endpoint: "files/upload",
          method: "MUTATION",
        })
        .setPayload({ name: "Notes", file })
        .send();

      expect(captured.current?.headers.get("content-type")).toStartWith("multipart/form-data; boundary=");
      expect(JSON.parse(captured.form?.get("data") as string)).toStrictEqual({
        json: { name: "Notes", file: {} },
        maps: [["file"]],
      });
      const sent = captured.form?.get("0") as File;
      expect(sent.name).toBe("notes.txt");
      expect(await sent.text()).toBe("file content");
    });

    it("should report the upload progress with the size of the parts", async () => {
      captureRequest("post", "files/upload");
      const onUploadProgress = vi.fn();
      const file = new File(["12345"], "five.txt");

      await client
        .createRequest<{ response: null; payload: { file: File } }>()({ endpoint: "files/upload", method: "MUTATION" })
        .setPayload({ file })
        .send({ onUploadProgress });

      const size = new Blob(['{"json":{"file":{}},"maps":[["file"]]}']).size + 5;
      expect(onUploadProgress).toHaveBeenCalledWith(expect.objectContaining({ total: size, loaded: size }));
    });

    it("should read a multipart response with the files", async () => {
      server.use(
        http.post(`${url}/files/download`, () => {
          const form = new FormData();
          form.set(
            "data",
            JSON.stringify({ json: { file: {}, at: "1970-01-01T00:00:00.000Z" }, meta: [[1, "at"]], maps: [["file"]] }),
          );
          form.set("0", new File(["hello"], "hello.txt", { type: "text/plain" }));
          return new HttpResponse(form);
        }),
      );

      const response = await client
        .createRequest<{ response: { file: File; at: Date } }>()({ endpoint: "files/download" })
        .send();

      expect(response.error).toBeNull();
      expect(response.data?.at).toStrictEqual(new Date(0));
      expect(response.data?.file.name).toBe("hello.txt");
      expect(await response.data?.file.text()).toBe("hello");
    });
  });

  describe("when using the custom serializers", () => {
    beforeEach(() => {
      client = createClient({ url }).setAdapter(OrpcAdapter({ customJsonSerializers: [moneySerializer] }));
    });

    it("should serialize the input and deserialize the output", async () => {
      const captured = captureRequest("post", "price", { json: { total: ["EUR", 250] }, meta: [[21, "total"]] });

      const response = await client
        .createRequest<{ response: { total: Money }; payload: { price: Money } }>()({ endpoint: "price" })
        .setPayload({ price: new Money("USD", 100) })
        .send();

      expect(JSON.parse(captured.body)).toStrictEqual({ json: { price: ["USD", 100] }, meta: [[21, "price"]] });
      expect(response.data?.total).toStrictEqual(new Money("EUR", 250));
    });

    it("should keep the serializers of different clients apart", async () => {
      const plainClient = createClient({ url }).setAdapter(OrpcAdapter());
      const captured = captureRequest("post", "price");

      await plainClient
        .createRequest<{ response: null; payload: { price: Money } }>()({ endpoint: "price" })
        .setPayload({ price: new Money("USD", 100) })
        .send();

      expect(captured.body).toBe('{"json":{"price":{"currency":"USD","cents":100}}}');
    });
  });

  describe("when the request fails", () => {
    it("should map the error", async () => {
      server.use(http.post(`${url}/user/byId`, () => HttpResponse.json({ json: notFound }, { status: 404 })));

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.data).toBeNull();
      expect(response.error).toStrictEqual(notFound);
      expect(response.status).toBe(404);
      expect(response.success).toBe(false);
      expect(response.extra?.headers["content-type"]).toContain("application/json");
    });

    it("should fail for a response that did not come from a procedure", async () => {
      server.use(
        http.post(`${url}/user/byId`, () => {
          return new HttpResponse("<html>Bad gateway</html>", {
            status: 502,
            headers: { "content-type": "text/html" },
          });
        }),
      );

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.data).toBeNull();
      expect(response.error).toStrictEqual(getErrorMessage());
      expect(response.status).toBe(502);
      expect(response.extra?.headers["content-type"]).toBe("text/html");
    });

    it("should handle a network error", async () => {
      server.use(http.post(`${url}/user/byId`, () => HttpResponse.error()));

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.error).toBeInstanceOf(Error);
      expect(response.status).toBe(0);
      expect(response.extra).toStrictEqual({ headers: {} });
    });

    it("should report an input that can't be serialized", async () => {
      const failure = new Error("Cannot serialize");
      client = createClient({ url }).setAdapter(
        OrpcAdapter({
          customJsonSerializers: [
            {
              ...moneySerializer,
              serialize: () => {
                throw failure;
              },
            },
          ],
        }),
      );
      const spy = vi.spyOn(globalThis, "fetch");

      const response = await client
        .createRequest<{ response: null; payload: Money }>()({ endpoint: "price" })
        .setPayload(new Money("USD", 1))
        .send();

      expect(response.error).toBe(failure);
      expect(response.status).toBe(0);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("should report an output that can't be deserialized with the response status", async () => {
      server.use(http.post(`${url}/user/byId`, () => HttpResponse.json({ json: "x", meta: [[0]] })));

      const response = await createQuery().setPayload({ id: 1 }).send();

      expect(response.error).toBeInstanceOf(TypeError);
      expect(response.status).toBe(200);
      expect(response.success).toBe(false);
    });
  });
});
