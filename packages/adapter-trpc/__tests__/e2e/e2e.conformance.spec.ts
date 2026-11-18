/**
 * @vitest-environment node
 *
 * The official tRPC client is the reference implementation of the protocol.
 * Every case sends the same call with both clients and expects the same request on the wire and the same result.
 */
import { createClient } from "@hyper-fetch/core";
import { createTRPCClient, httpLink, TRPCClientError } from "@trpc/client";
import type { AnyTRPCRouter, TRPC_ERROR_CODE_KEY } from "@trpc/server";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { TrpcAdapter } from "../../src/adapter";
import { createE2ETrpcServer } from "./e2e.trpc-server";

type WireCall = { url: string; method?: string; body: unknown; contentType: string | null };

const createRouter = (t: ReturnType<typeof initTRPC.create>) => {
  return t.router({
    echo: t.procedure.input((value) => value).query(({ input }) => input),
    echoMutation: t.procedure.input((value) => value).mutation(({ input }) => input),
    nested: t.router({
      deep: t.router({
        echo: t.procedure.input((value) => value).query(({ input }) => input),
      }),
    }),
    fail: t.procedure
      .input((value) => value as TRPC_ERROR_CODE_KEY)
      .query(({ input }) => {
        throw new TRPCError({ code: input, message: `Failed with ${input}` });
      }),
    failMutation: t.procedure
      .input((value) => value as TRPC_ERROR_CODE_KEY)
      .mutation(({ input }) => {
        throw new TRPCError({ code: input, message: `Failed with ${input}` });
      }),
  });
};

const toWireCall = (input: RequestInfo | URL | string, init?: RequestInit): WireCall => ({
  url: String(input),
  method: init?.method,
  body: init?.body ?? undefined,
  contentType: new Headers(init?.headers).get("content-type"),
});

/** Deterministic generator, the same inputs are tested on every run */
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d_2b_79_f5) % 2 ** 32;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 2 ** 32;
  };
};

const alphabet = [
  "a",
  "Z",
  "0",
  " ",
  "+",
  "&",
  "=",
  "?",
  "#",
  "%",
  "/",
  "\\",
  '"',
  "'",
  "\n",
  "ż",
  "日",
  "🎡",
  ".",
  "~",
];

const createJsonValue = (random: () => number, depth = 0): unknown => {
  const kind = Math.floor(random() * (depth > 3 ? 5 : 7));
  const text = () => {
    return Array.from(
      { length: Math.floor(random() * 12) },
      () => alphabet[Math.floor(random() * alphabet.length)],
    ).join("");
  };

  switch (kind) {
    case 0: {
      return null;
    }
    case 1: {
      return random() > 0.5;
    }
    case 2: {
      return Math.floor(random() * 2_000_001) - 1_000_000;
    }
    case 3: {
      return random() * 1000;
    }
    case 4: {
      return text();
    }
    case 5: {
      return Array.from({ length: Math.floor(random() * 4) }, () => createJsonValue(random, depth + 1));
    }
    default: {
      return Object.fromEntries(
        Array.from({ length: Math.floor(random() * 4) }, () => [text(), createJsonValue(random, depth + 1)]),
      );
    }
  }
};

const random = createRandom(20_240_101);
const generatedInputs = Array.from({ length: 150 }, (_, index) => [index, createJsonValue(random)] as const);

const jsonInputs: [string, unknown][] = [
  ["zero", 0],
  ["negative zero as JSON", -1],
  ["float", 1.5],
  ["large number", 1e21],
  ["small number", 1e-7],
  ["max safe integer", Number.MAX_SAFE_INTEGER],
  ["true", true],
  ["false", false],
  ["null", null],
  ["empty string", ""],
  ["space", " "],
  ["text with spaces", "a b  c"],
  ["plus sign", "a+b"],
  ["reserved url characters", "a&b=c?d#e/f"],
  ["percent", "100%25"],
  ["quotes", `"double" 'single'`],
  ["backslash", String.raw`a\b`],
  ["new lines", "a\nb\r\nc\t"],
  ["unicode", "zażółć gęślą jaźń"],
  ["emoji", "🎡🚀"],
  ["cjk", "日本語"],
  ["long text", "x".repeat(4000)],
  ["empty array", []],
  ["empty object", {}],
  ["array", [1, "2", null, true]],
  ["nested array", [[1, [2, [3, [4]]]]]],
  ["object", { id: 1, name: "John" }],
  ["nested object", { a: { b: { c: { d: [{ e: 1 }] } } } }],
  ["special keys", { "a b": 1, "c&d": 2, "e=f": 3, ż: 4, "": 5 }],
  ["object with null", { value: null }],
];

const superjsonInputs: [string, unknown][] = [
  ["date", new Date("2024-01-01T12:30:00.000Z")],
  [
    "map",
    new Map<string, unknown>([
      ["a", 1],
      ["b", { c: 2 }],
    ]),
  ],
  ["set", new Set([1, "2", 3])],
  ["bigint", 12_345_678_901_234_567_890n],
  ["regexp", /a+b/gi],
  ["url", new URL("https://example.com/path?query=1")],
  ["not a number", Number.NaN],
  ["infinity", Number.POSITIVE_INFINITY],
  ["negative infinity", Number.NEGATIVE_INFINITY],
  ["undefined in an object", { value: undefined, other: 1 }],
  ["undefined in an array", [undefined, 1]],
  ["nested values", { at: new Date(0), tags: new Set(["a"]), meta: new Map([["k", 1n]]), list: [new Date(1)] }],
  ["plain object", { id: 1 }],
  ["falsy number", 0],
  ["falsy boolean", false],
  ["falsy string", ""],
  ["null", null],
];

const errorCodes: [TRPC_ERROR_CODE_KEY, number, number][] = [
  ["PARSE_ERROR", 400, -32_700],
  ["BAD_REQUEST", 400, -32_600],
  ["UNAUTHORIZED", 401, -32_001],
  ["PAYMENT_REQUIRED", 402, -32_002],
  ["FORBIDDEN", 403, -32_003],
  ["NOT_FOUND", 404, -32_004],
  ["METHOD_NOT_SUPPORTED", 405, -32_005],
  ["TIMEOUT", 408, -32_008],
  ["CONFLICT", 409, -32_009],
  ["PRECONDITION_FAILED", 412, -32_012],
  ["PAYLOAD_TOO_LARGE", 413, -32_013],
  ["UNSUPPORTED_MEDIA_TYPE", 415, -32_015],
  ["UNPROCESSABLE_CONTENT", 422, -32_022],
  ["PRECONDITION_REQUIRED", 428, -32_028],
  ["TOO_MANY_REQUESTS", 429, -32_029],
  ["CLIENT_CLOSED_REQUEST", 499, -32_099],
  ["INTERNAL_SERVER_ERROR", 500, -32_603],
  ["NOT_IMPLEMENTED", 501, -32_603],
  ["BAD_GATEWAY", 502, -32_603],
  ["SERVICE_UNAVAILABLE", 503, -32_603],
  ["GATEWAY_TIMEOUT", 504, -32_603],
];

describe.each([
  { name: "without a transformer", transformer: undefined, inputs: jsonInputs },
  { name: "with superjson", transformer: superjson, inputs: [...jsonInputs, ...superjsonInputs] },
])("Trpc Adapter [ Conformance $name ]", ({ transformer, inputs }) => {
  const router = createRouter(initTRPC.create(transformer ? { transformer } : {}) as any) as AnyTRPCRouter;
  const server = createE2ETrpcServer(router);
  const nativeFetch = globalThis.fetch;

  let url = "";
  let officialCalls: WireCall[] = [];
  let adapterCalls: WireCall[] = [];

  const createOfficialClient = () => {
    return createTRPCClient<any>({
      links: [
        httpLink({
          url,
          transformer: transformer as any,
          fetch: (input, init) => {
            officialCalls.push(toWireCall(input as string, init as RequestInit));
            return nativeFetch(input as string, init as RequestInit);
          },
        }),
      ],
    }) as any;
  };

  const createAdapterClient = () => createClient({ url }).setAdapter(TrpcAdapter({ transformer }));

  const callAdapter = (endpoint: string, method: "QUERY" | "MUTATION", input?: unknown) => {
    const request = createAdapterClient().createRequest<{ response: unknown; payload: unknown }>()({
      endpoint,
      method,
    });
    return input === undefined ? request.send() : request.send({ payload: input });
  };

  beforeAll(async () => {
    url = await server.startServer();
  });

  beforeEach(() => {
    officialCalls = [];
    adapterCalls = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      adapterCalls.push(toWireCall(input as string, init));
      return nativeFetch(input, init);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await server.stopServer();
  });

  describe("when sending queries", () => {
    it.each(inputs)("should match the official client for %s", async (_name, input) => {
      const expected = await createOfficialClient().echo.query(input);
      const response = await callAdapter("echo", "QUERY", input);

      expect(adapterCalls[0].url).toBe(officialCalls[0].url);
      expect(adapterCalls[0].method).toBe(officialCalls[0].method);
      expect(adapterCalls[0].body).toBe(officialCalls[0].body);
      expect(response.success).toBe(true);
      expect(response.data).toStrictEqual(expected ?? null);
    });

    it("should match the official client without an input", async () => {
      const expected = await createOfficialClient().echo.query();
      const response = await callAdapter("echo", "QUERY");

      expect(adapterCalls[0].url).toBe(officialCalls[0].url);
      expect(response.data).toStrictEqual(expected ?? null);
    });

    it("should match the official client for a nested procedure", async () => {
      const expected = await createOfficialClient().nested.deep.echo.query({ id: 1 });
      const response = await callAdapter("/nested/deep/echo", "QUERY", { id: 1 });

      expect(adapterCalls[0].url).toBe(officialCalls[0].url);
      expect(response.data).toStrictEqual(expected);
    });
  });

  describe("when sending mutations", () => {
    it.each(inputs)("should match the official client for %s", async (_name, input) => {
      const expected = await createOfficialClient().echoMutation.mutate(input);
      const response = await callAdapter("echoMutation", "MUTATION", input);

      expect(adapterCalls[0].url).toBe(officialCalls[0].url);
      expect(adapterCalls[0].method).toBe(officialCalls[0].method);
      expect(adapterCalls[0].body).toBe(officialCalls[0].body);
      expect(adapterCalls[0].contentType).toBe(officialCalls[0].contentType);
      expect(response.success).toBe(true);
      expect(response.data).toStrictEqual(expected ?? null);
    });

    it("should match the official client without an input", async () => {
      const expected = await createOfficialClient().echoMutation.mutate();
      const response = await callAdapter("echoMutation", "MUTATION");

      expect(adapterCalls[0].url).toBe(officialCalls[0].url);
      expect(adapterCalls[0].body).toBe(officialCalls[0].body);
      expect(adapterCalls[0].contentType).toBe(officialCalls[0].contentType);
      expect(response.data).toStrictEqual(expected ?? null);
    });
  });

  describe("when sending generated inputs", () => {
    it.each(generatedInputs)("should match the official client for the query #%i", async (_index, input) => {
      const expected = await createOfficialClient().echo.query(input);
      const response = await callAdapter("echo", "QUERY", input);

      expect(adapterCalls[0].url).toBe(officialCalls[0].url);
      expect(response.data).toStrictEqual(expected);
    });

    it.each(generatedInputs)("should match the official client for the mutation #%i", async (_index, input) => {
      const expected = await createOfficialClient().echoMutation.mutate(input);
      const response = await callAdapter("echoMutation", "MUTATION", input);

      expect(adapterCalls[0].body).toBe(officialCalls[0].body);
      expect(response.data).toStrictEqual(expected);
    });
  });

  describe("when the procedure fails", () => {
    const getOfficialError = async (call: () => Promise<unknown>) => {
      const error = await call().catch((error: unknown) => error);
      expect(error).toBeInstanceOf(TRPCClientError);
      return error as TRPCClientError<AnyTRPCRouter>;
    };

    it.each(errorCodes)("should match the official client for a query with %s", async (code, status, jsonRpcCode) => {
      const official = await getOfficialError(() => createOfficialClient().fail.query(code));
      const response = await callAdapter("fail", "QUERY", code);

      expect(response.status).toBe(status);
      expect(response.success).toBe(false);
      expect(response.data).toBeNull();
      expect(response.error).toStrictEqual(official.shape);
      expect(response.error).toMatchObject({
        message: `Failed with ${code}`,
        code: jsonRpcCode,
        data: { code, httpStatus: status, path: "fail" },
      });
    });

    it.each(errorCodes)("should match the official client for a mutation with %s", async (code, status) => {
      const official = await getOfficialError(() => createOfficialClient().failMutation.mutate(code));
      const response = await callAdapter("failMutation", "MUTATION", code);

      expect(response.status).toBe(status);
      expect(response.error).toStrictEqual(official.shape);
    });

    it("should match the official client for an unknown procedure", async () => {
      const official = await getOfficialError(() => createOfficialClient().missing.query());
      const response = await callAdapter("missing", "QUERY");

      expect(response.status).toBe(404);
      expect(response.error).toStrictEqual(official.shape);
    });

    it("should match the official client for a query called as a mutation", async () => {
      const official = await getOfficialError(() => createOfficialClient().echo.mutate(1));
      const response = await callAdapter("echo", "MUTATION", 1);

      expect(response.status).toBe(405);
      expect(response.error).toStrictEqual(official.shape);
    });
  });
});
