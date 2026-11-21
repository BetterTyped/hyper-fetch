/**
 * Content of each package README banner. `render.mjs` turns every entry into `.github/assets/packages/<id>.png`.
 *
 * - `headline`: two lines, the second one is painted in the accent gradient
 * - `chips`: [lucide icon name, label]
 * - `code` + `language` + `file`: a real snippet that compiles against the package. Keep lines under 60 characters
 * - `terminal`: optional lines above the code. "$ " is a command, "! " an error, "+ " a success, anything else is dim
 * - `screenshot`: a file in documentation/static/img shown instead of code
 */
export const banners = [
  {
    id: "core",
    pkg: "@hyper-fetch/core",
    logo: "integration-hyper-fetch.svg",
    accent: "#fbc646",
    accentTo: "#fb923c",
    headline: ["Fetch anything.", "Type everything."],
    codeSize: 13,
    description:
      "Typed requests with cache, deduplication, retries, queues and offline replay built in. One <code>createRequest()</code> for every backend.",
    chips: [
      ["shield-check", "Typed end to end"],
      ["database", "Cache & dedupe"],
      ["rotate-cw", "Retries"],
      ["wifi-off", "Offline queue"],
    ],
    file: "api.ts",
    language: "typescript",
    code: `import { createClient } from "@hyper-fetch/core";

const client = createClient({ url: "https://api.example.com" });

const getUser = client.createRequest<{ response: User }>()({
  endpoint: "/users/:userId",
});

// data, error and status are typed
const { data, error } = await getUser
  .setParams({ userId: 1 })
  .send();`,
  },
  {
    id: "react",
    pkg: "@hyper-fetch/react",
    logo: "integration-react.svg",
    accent: "#61dafb",
    accentTo: "#a78bfa",
    headline: ["Server state for React.", "No useEffect required."],
    headlineSize: 50,
    description:
      "<code>useFetch</code>, <code>useSubmit</code> and <code>useListener</code> give every component typed data, loading and error state.",
    chips: [
      ["download", "useFetch"],
      ["send", "useSubmit"],
      ["sparkles", "Optimistic updates"],
      ["infinity", "Infinite lists"],
    ],
    file: "user-list.tsx",
    language: "tsx",
    code: `import { useFetch } from "@hyper-fetch/react";

export const UserList = () => {
  const { data, loading, error } = useFetch(getUsers);

  if (loading) return <Spinner />;
  if (error) return <ErrorState error={error} />;

  return data?.map((user) => (
    <UserCard key={user.id} user={user} />
  ));
};`,
  },
  {
    id: "sockets",
    pkg: "@hyper-fetch/sockets",
    logo: "integration-sockets.svg",
    accent: "#3b82f6",
    accentTo: "#22d3ee",
    headline: ["WebSockets and SSE.", "Fully typed."],
    description:
      "Typed listeners and emitters on one API, with automatic reconnects, auth per connection and throttling for fast streams.",
    chips: [
      ["radio", "Typed listeners"],
      ["refresh-cw", "Auto reconnect"],
      ["rss", "SSE"],
      ["layers", "Batched delivery"],
    ],
    file: "chat.ts",
    language: "typescript",
    code: `import { createSocketClient } from "@hyper-fetch/sockets";

const socket = createSocketClient({ url: "wss://chat.app" });

const onMessage = socket.createListener<Message>()({
  topic: "chat/:roomId",
});

onMessage
  .setParams({ roomId: "general" })
  .listen(({ data }) => render(data.author, data.text));`,
  },
  {
    id: "cli",
    pkg: "@hyper-fetch/cli",
    logo: "integration-openapi.svg",
    logoScale: 1.3,
    accent: "#4ade80",
    accentTo: "#fbc646",
    headline: ["OpenAPI schema in.", "Typed SDK out."],
    description:
      "One command turns an OpenAPI 3 schema into a typed SDK. Every path, param, payload and response, generated for you.",
    chips: [
      ["file-json", "OpenAPI 3"],
      ["link", "URL or local file"],
      ["terminal", "Interactive mode"],
      ["lock-open", "No lock-in"],
    ],
    terminal: ["$ npx @hyper-fetch/cli generate --url ./openapi.json", "+ ✔ Generated src/api/api-openapi.sdk.ts"],
    file: "app.ts",
    language: "typescript",
    code: `import { createSdk } from "./api/api-openapi.sdk";

const sdk = createSdk(client);

// Every endpoint from the schema, typed
const { data } = await sdk.users.$userId.$get
  .setParams({ userId: 1 })
  .send();`,
  },
  {
    id: "graphql",
    pkg: "@hyper-fetch/graphql",
    logo: "integration-graphql.svg",
    accent: "#e535ab",
    accentTo: "#f9a8d4",
    headline: ["GraphQL operations.", "Cached by variables."],
    headlineSize: 52,
    description:
      "Queries and mutations as typed requests. The variables are the payload, and each set of them gets its own cache entry.",
    chips: [
      ["braces", "gql documents"],
      ["shield-check", "Typed variables"],
      ["database", "Per-variable cache"],
      ["globe", "GET queries"],
    ],
    file: "user.ts",
    language: "typescript",
    code: `const GET_USER = gql\`
  query GetUser($id: ID!) {
    user(id: $id) { id name }
  }
\`;

const getUser = client.createRequest<{
  response: { user: User };
  payload: { id: string };
}>()({ endpoint: GET_USER });

const { data } = await getUser.send({ payload: { id: "1" } });`,
  },
  {
    id: "trpc",
    pkg: "@hyper-fetch/trpc",
    logo: "integration-trpc.svg",
    logoScale: 1.1,
    accent: "#398ccb",
    accentTo: "#7dd3fc",
    headline: ["Your tRPC router.", "Cached and typed."],
    description:
      "Procedures become HyperFetch requests with inputs, outputs and errors inferred from your <code>AppRouter</code>.",
    chips: [
      ["git-branch", "Router inference"],
      ["database", "Cache per input"],
      ["arrow-right-left", "superjson"],
      ["radio", "Subscriptions"],
    ],
    file: "api.ts",
    language: "typescript",
    code: `import type { AppRouter } from "./server";

const client = createClient({ url: "/trpc" })
  .setAdapter(TrpcAdapter());

const api = createSdk<typeof client, TrpcSchema<AppRouter>>(
  client,
  { camelCaseToKebabCase: false },
);

const { data } = await api.user.byId.$query
  .setPayload({ id: 1 })
  .send();`,
  },
  {
    id: "orpc",
    pkg: "@hyper-fetch/orpc",
    logo: "integration-orpc-dark.svg",
    accent: "#ff6ca5",
    accentTo: "#fbc646",
    headline: ["oRPC procedures.", "Typed down to errors."],
    description:
      "Inputs, outputs and defined errors inferred from your router. Event iterators become live listeners that resume after a reconnect.",
    chips: [
      ["shield-check", "Defined errors"],
      ["calendar", "Rich types"],
      ["database", "Cache per input"],
      ["activity", "Event iterators"],
    ],
    file: "planet.ts",
    language: "typescript",
    code: `const { data, error } = await api.planet.find.$query
  .setPayload({ id: 99 })
  .send();

if (error?.defined && error.code === "NOT_FOUND") {
  // error.data is typed from the procedure's .errors()
  notify(\`Planet \${error.data.id} does not exist\`);
}`,
  },
  {
    id: "hono",
    pkg: "@hyper-fetch/hono",
    logo: "integration-hono.svg",
    accent: "#ff5b11",
    accentTo: "#fbc646",
    headline: ["Your Hono app.", "Typed on the client."],
    description:
      "Route, validator and param types read straight from <code>typeof app</code>. No codegen, no runtime, no duplicated types.",
    chips: [
      ["wand-sparkles", "No codegen"],
      ["list-filter", "Typed validators"],
      ["radio", "WebSocket routes"],
      ["feather", "Zero runtime"],
    ],
    file: "api.ts",
    language: "typescript",
    code: `// server.ts
const app = new Hono().get("/users/:userId", getUser);
export type AppSchema = HonoSchema<typeof app>;

// client.ts
const sdk = createSdk<typeof client, AppSchema>(client);

const { data } = await sdk.users.$userId.$get
  .setParams({ userId: "1" })
  .send();`,
  },
  {
    id: "elysia",
    pkg: "@hyper-fetch/elysia",
    logo: "integration-elysia.svg",
    accent: "#c084fc",
    accentTo: "#f472b6",
    headline: ["Your Elysia app.", "Typed to every status."],
    headlineSize: 52,
    description:
      "Bodies, queries, params and errors read from <code>typeof app</code>. 2xx types <code>data</code>, every other status types <code>error</code>.",
    chips: [
      ["siren", "Errors per status"],
      ["boxes", "Plugins"],
      ["braces", "t.Object schemas"],
      ["feather", "Zero runtime"],
    ],
    file: "api.ts",
    language: "typescript",
    code: `// server.ts
const app = new Elysia().get("/users/:userId", getUser);
export type AppSchema = ElysiaSchema<typeof app>;

// client.ts
const sdk = createSdk<typeof client, AppSchema>(client);

const { data, error } = await sdk.users.$userId.$get
  .setParams({ userId: "1" })
  .send();`,
  },
  {
    id: "firebase",
    pkg: "@hyper-fetch/firebase",
    logo: "integration-firebase.svg",
    accent: "#ffa000",
    accentTo: "#ffca28",
    headline: ["Firestore and RTDB.", "As typed requests."],
    description:
      "<code>getDocs</code>, <code>addDoc</code> and <code>onSnapshot</code> work like the rest of your API calls, with cache, hooks and live listeners.",
    chips: [
      ["flame", "Firestore"],
      ["database", "Realtime Database"],
      ["funnel", "Typed queries"],
      ["radio", "Live listeners"],
    ],
    file: "users.ts",
    language: "typescript",
    code: `const getUsers = client.createRequest<{
  response: User[];
  queryParams?: FirestoreQueryParams<User>;
}>()({ endpoint: "users", method: "getDocs" });

// field names and values are checked against User
const { data } = await getUsers.send({
  queryParams: (c) => c.where("role", "==", "admin").limit(20),
});`,
  },
  {
    id: "firebase-admin",
    pkg: "@hyper-fetch/firebase-admin",
    logo: "integration-firebase.svg",
    accent: "#ff7043",
    accentTo: "#ffca28",
    headline: ["Firebase on the server.", "Same typed requests."],
    headlineSize: 50,
    description:
      "The Admin SDK behind HyperFetch requests for route handlers, workers and scripts. Retries, queues and typed queries included.",
    chips: [
      ["server", "Admin SDK"],
      ["rotate-cw", "Retries & queues"],
      ["funnel", "Typed queries"],
      ["radio", "Live listeners"],
    ],
    file: "worker.ts",
    language: "typescript",
    code: `initializeApp();

const client = new Client({ url: "" })
  .setAdapter(FirebaseAdminAdapter(getFirestore()));

const getJobs = client.createRequest<{ response: Job[] }>()({
  endpoint: "jobs",
  method: "getDocs",
});

const { data, error } = await getJobs.send();`,
  },
  {
    id: "axios",
    pkg: "@hyper-fetch/axios",
    logo: "integration-axios.svg",
    accent: "#7c5cff",
    accentTo: "#c4b5fd",
    headline: ["Axios underneath.", "HyperFetch on top."],
    description:
      "Keep your interceptors and Axios options. Add typed requests, cache, retries, offline replay and React hooks on top.",
    chips: [
      ["arrow-right-left", "Your interceptors"],
      ["settings-2", "Axios options"],
      ["database", "HyperFetch cache"],
      ["atom", "React hooks"],
    ],
    file: "client.ts",
    language: "typescript",
    code: `import axios from "axios";
import { AxiosAdapter } from "@hyper-fetch/axios";

axios.interceptors.request.use(withAuthToken);

const client = createClient({ url: "https://api.example.com" })
  .setAdapter(AxiosAdapter);

// every request now runs through Axios
const { data } = await getUsers.send();`,
  },
  {
    id: "plugin-devtools",
    pkg: "@hyper-fetch/plugin-devtools",
    logo: "integration-hyper-fetch.svg",
    accent: "#fb7185",
    accentTo: "#fbc646",
    headline: ["See every request.", "As it happens."],
    description: "One plugin streams requests, cache and queues from your app to the HyperFlow desktop devtools.",
    chips: [
      ["network", "Requests"],
      ["database", "Cache"],
      ["list-ordered", "Queues"],
      ["radio", "Sockets"],
    ],
    screenshot: "previews/network.png",
  },
  {
    id: "hyper-flow",
    pkg: "HyperFlow",
    logo: "integration-hyper-fetch.svg",
    accent: "#f59e0b",
    accentTo: "#fb7185",
    headline: ["Devtools for", "your API layer."],
    description:
      "A desktop app for macOS, Windows and Linux. Inspect requests, browse the cache, watch the queues and find slow endpoints.",
    chips: [
      ["network", "Network"],
      ["database", "Cache"],
      ["gauge", "Performance"],
      ["monitor", "macOS · Windows · Linux"],
    ],
    screenshot: "previews/dashboard.png",
  },
  {
    id: "plugin-eslint",
    pkg: "eslint-plugin-hyper-fetch",
    logo: "integration-eslint.svg",
    accent: "#8080f2",
    accentTo: "#c4b5fd",
    headline: ["A typo in a generic", "fails the lint."],
    headlineSize: 50,
    description:
      "Catches misspelled and empty generics on <code>createClient</code> and <code>createRequest</code> before they turn a response into <code>any</code>.",
    chips: [
      ["scan-search", "request-generic-types"],
      ["scan-search", "client-generic-types"],
      ["check-check", "Flat config preset"],
    ],
    terminal: [
      "$ npx eslint src",
      "src/api/users.ts",
      "! 2:3  error  Unexpected generic type(s) found: rsponse",
      "!            hyper-fetch/request-generic-types",
    ],
    file: "users.ts",
    language: "typescript",
    code: `const getUser = client.createRequest<{
  rsponse: User; // the typo that would type data as any
}>()({
  endpoint: "/users/:userId",
});`,
  },
  {
    id: "plugin-oxlint",
    pkg: "oxlint-plugin-hyper-fetch",
    logo: "integration-oxlint.svg",
    logoScale: 1.15,
    accent: "#38bdf8",
    accentTo: "#93fffc",
    headline: ["The HyperFetch rules.", "At Oxlint speed."],
    description:
      "The ESLint plugin rules as an Oxlint JS plugin, about 16x faster on the HyperFetch codebase. Same rule names.",
    chips: [
      ["zap", "Oxlint JS plugin"],
      ["scan-search", "Same rule names"],
      ["layers", "Composed generics"],
    ],
    terminal: [
      "$ npx oxlint",
      "! × hyper-fetch(request-generic-types): Unexpected generic",
      "!   type(s) found: paylod",
      "Found 0 warnings and 1 error.",
    ],
    file: ".oxlintrc.json",
    language: "json",
    code: `{
  "jsPlugins": ["oxlint-plugin-hyper-fetch"],
  "rules": {
    "hyper-fetch/client-generic-types": "error",
    "hyper-fetch/request-generic-types": "error"
  }
}`,
  },
];
