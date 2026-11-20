import { AxiosAdapter } from "@hyper-fetch/axios";
import { FirebaseAdapter } from "@hyper-fetch/firebase";
import { FirebaseAdminAdapter } from "@hyper-fetch/firebase-admin";
import type { ClientInstance, RequestInstance } from "@hyper-fetch/core";
import { Adapter, createClient } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";
import { OrpcAdapter } from "@hyper-fetch/orpc";
import { TrpcAdapter } from "@hyper-fetch/trpc";
import { delay as wait, http, HttpResponse } from "msw";
import type { SetupServer } from "msw/node";
import { initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export type User = { id: number; name: string };

type Reply = { delay?: number };

/**
 * One adapter as HyperFlow meets it: how users create requests with it, and how its server answers on the wire.
 * Every compatibility spec runs once per entry, so adding an adapter here covers all HyperFlow flows for it.
 */
export type AdapterCase = {
  /** Shown in test names and the compatibility report */
  name: string;
  /** `adapter.name` HyperFlow should present */
  adapterName: string;
  createClient: () => ClientInstance;
  /** A cached read of one user */
  createRead: (client: ClientInstance, id: number) => RequestInstance;
  /** A write that creates a user */
  createWrite: (client: ClientInstance) => RequestInstance;
  /** Payload to send with the write */
  writePayload: Record<string, unknown>;
  /** What the network list shows for the read */
  readLabel: (id: number) => string;
  /** Answer reads of this user with data */
  replyRead: (server: SetupServer, user: User, options?: Reply) => void;
  /** Answer the write with an error */
  failWrite: (server: SetupServer, message: string) => void;
  /** Status the failed write ends with */
  failedStatus: number | string;
};

const url = "http://localhost:5000";

const replyAfter = async (options?: Reply) => {
  if (options?.delay) {
    await wait(options.delay);
  }
};

const restCase = (name: string, adapterName: string, setAdapter: (client: ClientInstance) => ClientInstance) => {
  return {
    name,
    adapterName,
    createClient: () => setAdapter(createClient({ url })),
    createRead: (client, id) =>
      // Route params can't be inferred through the generic ClientInstance
      client.createRequest<{ response: User }>()({ endpoint: "/users/:id" }).setParams({ id } as never),
    createWrite: (client) =>
      client.createRequest<{ response: User; payload: { name: string } }>()({ endpoint: "/users", method: "POST" }),
    writePayload: { name: "" },
    readLabel: (id) => `/users/${id}`,
    replyRead: (server, user, options) => {
      server.use(
        http.get(`${url}/users/${user.id}`, async () => {
          await replyAfter(options);
          return HttpResponse.json(user);
        }),
      );
    },
    failWrite: (server, message) => {
      server.use(http.post(`${url}/users`, () => HttpResponse.json({ message }, { status: 400 })));
    },
    failedStatus: 400,
  } satisfies AdapterCase;
};

const fetchCase = restCase("fetch (default)", createClient({ url }).adapter.name, (client) => client);
const axiosCase = restCase("axios", "axios-adapter", (client) => client.setAdapter(AxiosAdapter));

const graphqlCase: AdapterCase = {
  name: "graphql",
  adapterName: "graphql",
  createClient: () => createClient({ url: `${url}/graphql` }).setAdapter(GraphqlAdapter()),
  createRead: (client, id) =>
    client
      .createRequest<{ response: { user: User }; payload: { id: number } }>()({
        endpoint: "query GetUser($id: Int!) { user(id: $id) { id name } }",
      })
      .setPayload({ id }),
  createWrite: (client) =>
    client.createRequest<{ response: { createUser: User }; payload: { name: string } }>()({
      endpoint: "mutation CreateUser($name: String!) { createUser(name: $name) { id name } }",
    }),
  writePayload: { name: "" },
  readLabel: () => "GetUser",
  replyRead: (server, user, options) => {
    server.use(
      http.post(`${url}/graphql`, async ({ request }) => {
        const body = (await request.clone().json()) as { query: string; variables?: { id?: number } };
        if (!body.query.includes("GetUser") || body.variables?.id !== user.id) {
          return undefined;
        }
        await replyAfter(options);
        return HttpResponse.json({ data: { user } });
      }),
    );
  },
  failWrite: (server, message) => {
    server.use(
      http.post(`${url}/graphql`, async ({ request }) => {
        const body = (await request.clone().json()) as { query: string };
        if (!body.query.includes("CreateUser")) {
          return undefined;
        }
        return HttpResponse.json({ errors: [{ message }] }, { status: 400 });
      }),
    );
  },
  failedStatus: 400,
};

const trpcCase: AdapterCase = {
  name: "trpc",
  adapterName: "trpc",
  createClient: () => createClient({ url: `${url}/trpc` }).setAdapter(TrpcAdapter()),
  createRead: (client, id) =>
    client
      .createRequest<{ response: User; payload: { id: number } }>()({ endpoint: "user.byId", method: "QUERY" })
      .setPayload({ id }),
  createWrite: (client) =>
    client.createRequest<{ response: User; payload: { name: string } }>()({
      endpoint: "user.create",
      method: "MUTATION",
    }),
  writePayload: { name: "" },
  readLabel: () => "user.byId",
  replyRead: (server, user, options) => {
    server.use(
      http.get(`${url}/trpc/user.byId`, async ({ request }) => {
        if (!new URL(request.url).searchParams.get("input")?.includes(String(user.id))) {
          return undefined;
        }
        await replyAfter(options);
        return HttpResponse.json({ result: { data: user } });
      }),
    );
  },
  failWrite: (server, message) => {
    server.use(
      http.post(`${url}/trpc/user.create`, () =>
        HttpResponse.json(
          { error: { message, code: -32_600, data: { code: "BAD_REQUEST", httpStatus: 400, path: "user.create" } } },
          { status: 400 },
        ),
      ),
    );
  },
  failedStatus: 400,
};

const orpcCase: AdapterCase = {
  name: "orpc",
  adapterName: "orpc",
  createClient: () => createClient({ url: `${url}/rpc` }).setAdapter(OrpcAdapter()),
  createRead: (client, id) =>
    client
      .createRequest<{ response: User; payload: { id: number } }>()({ endpoint: "user/byId", method: "QUERY" })
      .setPayload({ id }),
  createWrite: (client) =>
    client.createRequest<{ response: User; payload: { name: string } }>()({
      endpoint: "user/create",
      method: "MUTATION",
    }),
  writePayload: { name: "" },
  // oRPC normalizes procedure paths to a leading slash
  readLabel: () => "/user/byId",
  replyRead: (server, user, options) => {
    server.use(
      http.all(`${url}/rpc/user/byId`, async ({ request }) => {
        const body = request.method === "GET" ? new URL(request.url).search : await request.clone().text();
        if (!body.includes(String(user.id))) {
          return undefined;
        }
        await replyAfter(options);
        return HttpResponse.json({ json: user });
      }),
    );
  },
  failWrite: (server, message) => {
    server.use(
      http.post(`${url}/rpc/user/create`, () =>
        HttpResponse.json({ json: { defined: true, code: "BAD_REQUEST", status: 400, message } }, { status: 400 }),
      ),
    );
  },
  failedStatus: 400,
};

/**
 * Firebase-like: method names instead of HTTP verbs, text statuses and no HTTP at all. Stands in for the Firebase
 * adapters, which need the Firebase emulator.
 */
const createDocumentsCase = (): AdapterCase => {
  type Answer = { user?: User; error?: string; delay?: number };
  const answers = new Map<string, Answer>();

  const createDocumentsAdapter = () =>
    new Adapter<Record<string, never>, "getDoc" | "addDoc", "success" | "error", { snapshot: boolean }>({
      name: "documents",
      defaultMethod: "getDoc",
      defaultExtra: { snapshot: false },
      systemErrorStatus: "error",
      systemErrorExtra: { snapshot: false },
    }).setFetcher(async ({ request, onSuccess, onError, createAbortListener, onRequestStart, onRequestEnd }) => {
      const answer = answers.get(`${request.method} ${request.endpoint}`);
      // Like the Firebase adapters, report the request lifecycle
      onRequestStart();
      let aborted = false;
      // Core reports the abort, the fetcher only has to stop
      createAbortListener({
        status: "error",
        extra: { snapshot: false },
        onAbort: () => {
          aborted = true;
        },
      });
      await new Promise((resolve) => {
        setTimeout(resolve, answer?.delay ?? 0);
      });
      if (aborted) {
        return;
      }
      onRequestEnd();
      if (!answer || answer.error) {
        onError({ error: { message: answer?.error ?? "not-found" }, status: "error", extra: { snapshot: true } });
        return;
      }
      onSuccess({ data: answer.user, status: "success", extra: { snapshot: true } });
    });

  return {
    name: "custom (firebase-like)",
    adapterName: "documents",
    createClient: () => {
      answers.clear();
      return createClient({ url: "documents://" }).setAdapter(createDocumentsAdapter());
    },
    createRead: (client, id) => client.createRequest<{ response: User }>()({ endpoint: `users/${id}` }),
    createWrite: (client) =>
      client.createRequest<{ response: User; payload: { name: string } }>()({ endpoint: "users", method: "addDoc" }),
    writePayload: { name: "" },
    readLabel: (id) => `users/${id}`,
    replyRead: (_server, user, options) => {
      answers.set(`getDoc users/${user.id}`, { user, delay: options?.delay });
    },
    failWrite: (_server, message) => {
      answers.set("addDoc users", { error: message });
    },
    failedStatus: "error",
  };
};

/**
 * The real Firebase adapters, answered by the HyperFetch mocker instead of the Firebase emulator: HyperFlow sees
 * their names, methods, statuses and options, only the transport is mocked.
 */
const createFirebaseCase = ({
  name,
  adapterName,
  createFirebaseClient,
}: {
  name: string;
  adapterName: string;
  createFirebaseClient: () => ClientInstance;
}): AdapterCase => {
  type Answer = { user?: User; error?: string; delay?: number };
  const answers = new Map<string, Answer>();

  const withMock = <Request extends RequestInstance>(request: Request) =>
    request.setMock(async ({ request: sent }) => {
      const answer = answers.get(`${sent.method} ${sent.endpoint}`);
      if (answer?.delay) {
        await wait(answer.delay);
      }
      if (!answer || answer.error) {
        return { data: null, error: { code: "invalid-argument", message: answer?.error ?? "not-found" }, status: "error" };
      }
      return { data: answer.user, error: null, status: "success" };
    });

  return {
    name,
    adapterName,
    createClient: () => {
      answers.clear();
      return createFirebaseClient();
    },
    createRead: (client, id) => withMock(client.createRequest<{ response: User }>()({ endpoint: `users/${id}`, method: "getDoc" })),
    createWrite: (client) =>
      withMock(client.createRequest<{ response: User; payload: { name: string } }>()({ endpoint: "users", method: "addDoc" })),
    writePayload: { name: "" },
    readLabel: (id) => `users/${id}`,
    replyRead: (_server, user, options) => {
      answers.set(`getDoc users/${user.id}`, { user, delay: options?.delay });
    },
    failWrite: (_server, message) => {
      answers.set("addDoc users", { error: message });
    },
    failedStatus: "error",
  };
};

let firebaseApps = 0;

const firebaseCase = createFirebaseCase({
  name: "firebase",
  adapterName: "firebase",
  createFirebaseClient: () => {
    firebaseApps += 1;
    const app = initializeApp({ projectId: "demo-hyperflow" }, `hyperflow-${firebaseApps}`);
    return createClient({ url: "" }).setAdapter(FirebaseAdapter(getFirestore(app)));
  },
});

const firebaseAdminCase = createFirebaseCase({
  name: "firebase-admin",
  adapterName: "firebase-admin",
  createFirebaseClient: () => {
    firebaseApps += 1;
    const app = initializeAdminApp({ projectId: "demo-hyperflow" }, `hyperflow-admin-${firebaseApps}`);
    return createClient({ url: "" }).setAdapter(FirebaseAdminAdapter(getAdminFirestore(app)));
  },
});

export const adapterCases: AdapterCase[] = [
  fetchCase,
  axiosCase,
  graphqlCase,
  trpcCase,
  orpcCase,
  firebaseCase,
  firebaseAdminCase,
  createDocumentsCase(),
];
