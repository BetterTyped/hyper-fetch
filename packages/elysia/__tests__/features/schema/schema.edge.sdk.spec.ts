import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { createClient, createSdk } from "@hyper-fetch/core";
import type { AddressInfo } from "node:net";

import type { ElysiaSchema } from "../../../src";
import { edgeApp, rootParamApp } from "../../utils/edge-app";

type Schema = ElysiaSchema<typeof edgeApp>;
type RootSchema = ElysiaSchema<typeof rootParamApp>;

const startServer = (fetch: (request: Request) => Response | Promise<Response>) =>
  new Promise<ServerType>((resolve) => {
    const server = serve({ fetch, port: 0 }, () => resolve(server));
  });

const stopServer = (server: ServerType) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

const getUrl = (server: ServerType) => `http://localhost:${(server.address() as AddressInfo).port}`;

describe("ElysiaSchema [ Edge cases against an Elysia server ]", () => {
  let server: ServerType;
  let url: string;

  const createAppSdk = () => {
    const client = createClient({ url });
    return createSdk<typeof client, Schema>(client);
  };

  beforeAll(async () => {
    server = await startServer(edgeApp.fetch);
    url = getUrl(server);
  });

  afterAll(async () => {
    await stopServer(server);
  });

  describe("When the path is unusual", () => {
    it("should call a route registered on an empty path", async () => {
      const { data } = await createAppSdk().$get.send();

      expect(data).toBe("root");
    });

    it("should call the / route of a prefixed plugin and its nested routes", async () => {
      const sdk = createAppSdk();

      const index = await sdk.level.$get.send();
      const nested = await sdk.level.level.$get.send();
      const param = await sdk.level.$id.ok.$get.setParams({ id: "7" }).send();

      expect(index.data).toBe("level-index");
      expect(nested.data).toBe("level-level");
      expect(param.data).toStrictEqual({ id: "7" });
    });

    it("should call a path with a segment named index", async () => {
      const { data } = await createAppSdk().search.index.$indexId.stocks.$get.setParams({ indexId: "a" }).send();

      expect(data).toStrictEqual({ indexId: "a" });
    });

    it("should call a group with an empty guard", async () => {
      const { data } = await createAppSdk().nested.data.$get.send();

      expect(data).toStrictEqual({ nested: true });
    });

    it("should call a deeply nested path", async () => {
      const { data } = await createAppSdk().a.b.c.d.e.f.g.h.$get.send();

      expect(data).toStrictEqual({ depth: 8 });
    });

    it("should send a number param that a params schema parses", async () => {
      const { data } = await createAppSdk().params.$count.$get.setParams({ count: 5 }).send();

      expect(data).toStrictEqual({ count: 5 });
    });
  });

  describe("When the response is not plain JSON", () => {
    it("should receive literal and primitive responses", async () => {
      const sdk = createAppSdk();

      const number = await sdk.number.$get.send();
      const bool = await sdk.true.$get.send();

      expect(number.data).toBe(1);
      expect(bool.data).toBe(true);
    });

    it("should receive null and a handler without a return value as an empty body", async () => {
      const sdk = createAppSdk();

      const empty = await sdk.null.$get.send();
      const nothing = await sdk.void.$get.send();

      expect(empty.success).toBe(true);
      expect(empty.data).toBe("");
      expect(nothing.success).toBe(true);
      expect(nothing.data).toBe("");
    });

    it("should receive dates as ISO strings", async () => {
      const { data } = await createAppSdk().date.$get.send();

      expect(data).toStrictEqual({ date: "2026-01-02T03:04:05.000Z", history: ["1970-01-01T00:00:00.000Z"] });
    });

    it("should resolve streamed and raw responses without failing", async () => {
      const sdk = createAppSdk();

      const responses = await Promise.all([
        sdk.generator.$get.send(),
        sdk.asyncGenerator.$get.send(),
        sdk.sse.$get.send(),
        sdk.response.$get.send(),
      ]);

      expect(responses.map(({ success }) => success)).toStrictEqual([true, true, true, true]);
      expect(responses[3].data).toBe("raw text");
    });

    it("should read a streamed route as a stream with the streaming option", async () => {
      const { data } = await createAppSdk().generator.$get.setOptions({ streaming: true }).send();

      expect(data).toBeInstanceOf(ReadableStream);
      expect(await new Response(data as ReadableStream).text()).toBe("ab");
    });

    it("should receive the JSON body of a handler that returns any", async () => {
      const { data } = await createAppSdk().any.$get.send();

      expect(data).toStrictEqual({ loose: true });
    });

    it("should follow a redirect to the target route", async () => {
      const { data, status } = await createAppSdk().redirect.$get.send();

      expect(status).toBe(200);
      expect(data).toBe(1);
    });
  });

  describe("When the route answers with an error status", () => {
    it("should resolve a status passed by name", async () => {
      const { data, error, status } = await createAppSdk().teapot.$get.send();

      expect(status).toBe(418);
      expect(data).toBeNull();
      expect(error).toStrictEqual({ brewing: false });
    });

    it("should resolve a 3xx status as an error", async () => {
      const { error, status, success } = await createAppSdk().multipleChoices.$get.send();

      expect(success).toBe(false);
      expect(status).toBe(300);
      expect(error).toStrictEqual({ choices: ["a", "b"] });
    });

    it("should resolve the status a macro returns", async () => {
      const sdk = createAppSdk();

      const denied = await sdk.secret.$get.send();
      const allowed = await sdk.secret.$get.setHeaders({ authorization: "Bearer token" }).send();

      expect(denied.status).toBe(403);
      expect(denied.error).toStrictEqual({ reason: "forbidden" });
      expect(allowed.data).toStrictEqual({ userId: "1" });
    });

    it("should resolve an error a handler throws with its status", async () => {
      const { error, status, success } = await createAppSdk().throws.$get.send();

      expect(success).toBe(false);
      expect(status).toBe(500);
      expect(error).toBe("Unexpected failure");
    });

    it("should send the headers a headers schema requires with setHeaders", async () => {
      const sdk = createAppSdk();

      const missing = await sdk.headers.$get.send();
      const sent = await sdk.headers.$get.setHeaders({ username: "ann" }).send();

      expect(missing.status).toBe(422);
      expect(sent.data).toStrictEqual({ username: "ann" });
    });

    it("should resolve a missing required query param as a validation error", async () => {
      const client = createClient({ url });
      const request = client.createRequest()({ endpoint: "/guarded" });

      const { error, status } = await request.send();

      expect(status).toBe(422);
      expect(error).toMatchObject({ type: "validation", on: "query" });
    });
  });

  describe("When the request sends a body", () => {
    it("should send a body resolved from a model", async () => {
      const { data } = await createAppSdk()
        .deep.nested.mirror.$post.setPayload({ username: "ann", password: "secret" })
        .send();

      expect(data).toStrictEqual({ username: "ann", password: "secret" });
    });

    it("should send primitive and array bodies", async () => {
      const sdk = createAppSdk();

      const text = await sdk.string.$post.setPayload("hello").send();
      const list = await sdk.array.$post.setPayload(["a", "b"]).send();

      expect(text.data).toBe("hello");
      expect(list.data).toStrictEqual(["a", "b"]);
    });

    it("should send an optional body with and without the payload", async () => {
      const sdk = createAppSdk();

      const withBody = await sdk.optionalBody.$post.setPayload({ note: "hi" }).send();
      const withoutBody = await sdk.optionalBody.$post.setPayload(null).send();

      expect(withBody.data).toStrictEqual({ received: { note: "hi" } });
      expect(withoutBody.data).toStrictEqual({ received: null });
    });

    it("should send each member of a union body", async () => {
      const sdk = createAppSdk();

      const first = await sdk.unionBody.$post.setPayload({ a: "x" }).send();
      const second = await sdk.unionBody.$post.setPayload({ b: 2 }).send();

      expect(first.data).toStrictEqual({ a: "x" });
      expect(second.data).toStrictEqual({ b: 2 });
    });

    it("should send a Date the body schema parses", async () => {
      const { data } = await createAppSdk()
        .dateBody.$post.setPayload({ date: new Date("2030-06-01T00:00:00.000Z") })
        .send();

      expect(data).toStrictEqual({ year: 2030 });
    });

    it("should upload files as FormData", async () => {
      const sdk = createAppSdk();
      const single = new FormData();
      single.append("title", "report");
      single.append("file", new File(["12345"], "report.txt"));
      const multiple = new FormData();
      multiple.append("files", new File(["a"], "a.txt"));
      multiple.append("files", new File(["b"], "b.txt"));

      const upload = await sdk.upload.$post.setPayload(single).send();
      const uploads = await sdk.uploads.$post.setPayload(multiple).send();

      expect(upload.data).toStrictEqual({ name: "report", size: 5 });
      expect(uploads.data).toStrictEqual({ count: 2 });
    });

    it("should send a form without its optional file", async () => {
      const { data } = await createAppSdk().optionalFile.$post.setPayload(new FormData()).send();

      expect(data).toStrictEqual({ hasFile: false });
    });

    it("should send a DELETE without a body", async () => {
      const { data } = await createAppSdk().empty.$delete.send();

      expect(data).toStrictEqual({ deleted: true });
    });
  });

  describe("When the request sends query params", () => {
    it("should send a Date and a number the query schema parses", async () => {
      const { data } = await createAppSdk()
        .queryTypes.$get.setQueryParams({ day: new Date("2026-03-04T00:00:00.000Z"), count: 3 })
        .send();

      expect(data).toStrictEqual({ day: "2026-03-04T00:00:00.000Z", count: 3, note: null });
    });

    it("should fail the default bracket format for array query params", async () => {
      const { status } = await createAppSdk()
        .queryArray.$get.setQueryParams({ tags: ["a", "b"] })
        .send();

      expect(status).toBe(422);
    });

    it("should send an array query param with repeated keys", async () => {
      const client = createClient({ url });
      client.adapter.setQueryParamsMapperConfig({ arrayFormat: "none" });
      const sdk = createSdk<typeof client, Schema>(client);

      const { data } = await sdk.queryArray.$get.setQueryParams({ tags: ["a", "b"] }).send();

      expect(data).toStrictEqual({ tags: ["a", "b"] });
    });

    it("should send optional query params with and without values", async () => {
      const sdk = createAppSdk();

      const withValue = await sdk.queryPartial.$get.setQueryParams({ page: "2" }).send();
      const withoutValue = await sdk.queryPartial.$get.setQueryParams({}).send();

      expect(withValue.data).toStrictEqual({ page: "2" });
      expect(withoutValue.data).toStrictEqual({});
    });

    it("should send the query a guard requires", async () => {
      const { data } = await createAppSdk().guarded.$get.setQueryParams({ token: "abc" }).send();

      expect(data).toStrictEqual({ token: "abc" });
    });
  });

  describe("When the method is not GET or POST", () => {
    it("should send HEAD and OPTIONS requests", async () => {
      const sdk = createAppSdk();

      const head = await sdk.head.$head.send();
      const options = await sdk.options.$options.send();

      expect(head.status).toBe(200);
      expect(options.data).toBe("options");
    });
  });
});

describe("ElysiaSchema [ Root param against an Elysia server ]", () => {
  let server: ServerType;

  beforeAll(async () => {
    server = await startServer(rootParamApp.fetch);
  });

  afterAll(async () => {
    await stopServer(server);
  });

  it("should fill a param at the root of the app", async () => {
    const client = createClient({ url: getUrl(server) });
    const sdk = createSdk<typeof client, RootSchema>(client);

    const { data } = await sdk.$id.$get.setParams({ id: "42" }).send();

    expect(data).toStrictEqual({ id: "42" });
  });
});
