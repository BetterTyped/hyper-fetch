import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import { HttpResponse, http } from "msw";
import { z } from "zod";

export const BASE_URL = "http://localhost:5000";
export const SOCKET_URL = "ws://localhost:1234";

export const PostSchema = z.object({
  id: z.number(),
  teamId: z.number(),
  title: z.string().min(1),
  body: z.string(),
  likes: z.number(),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.number(),
});

export const PostSummarySchema = PostSchema.omit({ body: true });

export type Post = z.infer<typeof PostSchema>;
export type PostSummary = z.infer<typeof PostSummarySchema>;

export const createPost = (id: number, overrides: Partial<Post> = {}): Post => ({
  id,
  teamId: 1,
  title: `Post ${id}`,
  body: `Body of post ${id}`,
  likes: id,
  archived: false,
  createdAt: `2026-01-${String(id).padStart(2, "0")}`,
  updatedAt: 1,
  ...overrides,
});

export const toSummary = ({ body: _body, ...summary }: Post): PostSummary => summary;

export const createHttpClient = (url = BASE_URL) => new Client({ url });

export type HttpClient = ReturnType<typeof createHttpClient>;

export const createRequests = (client: HttpClient) => ({
  getTeamPosts: client.createRequest<{
    response: PostSummary[];
    queryParams?: { likes_gt?: number; sort?: string; limit?: number; title?: string };
  }>()({ endpoint: "/teams/:teamId/posts" }),
  getTeamFullPosts: client.createRequest<{
    response: { items: Post[] };
    queryParams?: { likes_gt?: number; sort?: string; limit?: number };
  }>()({ endpoint: "/teams/:teamId/full-posts" }),
  getAllPosts: client.createRequest<{
    response: { items: Post[]; next: string | null };
    queryParams?: { cursor?: string; sort?: string; limit?: number };
  }>()({ endpoint: "/all-posts" }),
  getPost: client.createRequest<{ response: Post }>()({ endpoint: "/posts/:postId" }),
  getPostsByIds: client.createRequest<{ response: Post[]; queryParams?: { ids?: number[] } }>()({
    endpoint: "/posts-by-ids",
  }),
  searchPosts: client.createRequest<{ response: { results: Post[] }; queryParams?: { q?: string } }>()({
    endpoint: "/search",
  }),
  createPostRequest: client.createRequest<{ response: Post; payload: Omit<Post, "id"> & { id?: number } }>()({
    endpoint: "/posts",
    method: "POST",
  }),
  updatePostRequest: client.createRequest<{ response: Post; payload: Partial<Post> }>()({
    endpoint: "/posts/:postId",
    method: "PATCH",
  }),
  deletePostRequest: client.createRequest<{ response: null }>()({ endpoint: "/posts/:postId", method: "DELETE" }),
});

export const createSocket = (url = SOCKET_URL) => new Socket({ url, reconnectTime: 10 });

export type TestSocket = ReturnType<typeof createSocket>;

export const createListeners = (socket: TestSocket) => ({
  onPostCreated: socket.createListener<Post>()({ topic: "teams/:teamId/posts/created" }),
  onPostChanged: socket.createListener<Partial<Post> & { id: number }>()({ topic: "teams/:teamId/posts/changed" }),
  onPostDeleted: socket.createListener<{ id: number }>()({ topic: "teams/:teamId/posts/deleted" }),
  onAnyPostCreated: socket.createListener<Post>()({ topic: "posts/created" }),
  onAnyPostChanged: socket.createListener<Partial<Post> & { id: number }>()({ topic: "posts/changed" }),
  onAnyPostDeleted: socket.createListener<{ postId: number }>()({ topic: "posts/deleted" }),
  onTeamChanges: socket.createListener<{ upsert: Post[]; delete: number[]; refetch?: number[] }>()({
    topic: "teams/:teamId/changes",
  }),
  onPostChanges: socket.createListener<{ upsert: Post[]; delete: number[] }>()({ topic: "posts/:postId/changes" }),
});

type RouteContext = { params: Record<string, string>; url: URL; body: unknown };
type RouteResult = { status?: number; data?: unknown; networkError?: boolean };
export type RouteResolver = (context: RouteContext) => RouteResult | Promise<RouteResult>;

/** Answers requests at the network level with msw and records every call */
export const createApi = (server: { use: (...handlers: ReturnType<typeof http.get>[]) => void }) => {
  const calls: { method: string; path: string; url: URL; body: unknown }[] = [];
  const route = (method: "get" | "post" | "patch" | "put" | "delete", path: string, resolver: RouteResolver) => {
    server.use(
      http[method](`${BASE_URL}${path}`, async ({ params, request }) => {
        const url = new URL(request.url);
        const text = method === "get" ? "" : await request.text();
        const body = text ? JSON.parse(text) : undefined;
        calls.push({ method, path: url.pathname, url, body });
        const result = await resolver({ params: params as Record<string, string>, url, body });
        if (result.networkError) {
          return HttpResponse.error();
        }
        return HttpResponse.json((result.data ?? null) as never, { status: result.status ?? 200 });
      }),
    );
  };
  return {
    calls,
    callsTo: (path: string, method = "get") => calls.filter((call) => call.path === path && call.method === method),
    get: (path: string, resolver: RouteResolver) => route("get", path, resolver),
    post: (path: string, resolver: RouteResolver) => route("post", path, resolver),
    patch: (path: string, resolver: RouteResolver) => route("patch", path, resolver),
    put: (path: string, resolver: RouteResolver) => route("put", path, resolver),
    delete: (path: string, resolver: RouteResolver) => route("delete", path, resolver),
  };
};

type E2EServer = {
  route: (
    method: string,
    path: string,
    // oxlint-disable-next-line max-params -- the e2e server's handler signature
    handler: (
      req: { url?: string },
      res: { writeHead: (status: number, headers: Record<string, string>) => void; end: (body: string) => void },
      body: Buffer,
      params: Record<string, string>,
    ) => void | Promise<void>,
  ) => void;
  getUrl: () => string;
};

/** The same interface as `createApi`, answered by a real HTTP server */
export const createE2EApi = (server: E2EServer) => {
  const calls: { method: string; path: string; url: URL; body: unknown }[] = [];
  const resolvers = new Map<string, RouteResolver>();
  const registered = new Set<string>();
  const route = (method: string, path: string, resolver: RouteResolver) => {
    const id = `${method} ${path}`;
    resolvers.set(id, resolver);
    if (registered.has(id)) {
      return;
    }
    registered.add(id);
    // oxlint-disable-next-line max-params -- the e2e server's handler signature
    server.route(method, path, async (req, res, raw, params) => {
      const url = new URL(req.url ?? "/", server.getUrl());
      const text = raw.toString();
      const body = text ? JSON.parse(text) : undefined;
      calls.push({ method, path: url.pathname, url, body });
      const result = await resolvers.get(id)!({ params, url, body });
      res.writeHead(result.status ?? 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result.data ?? null));
    });
  };
  return {
    calls,
    reset: () => {
      calls.length = 0;
    },
    callsTo: (path: string, method = "get") => calls.filter((call) => call.path === path && call.method === method),
    get: (path: string, resolver: RouteResolver) => route("get", path, resolver),
    post: (path: string, resolver: RouteResolver) => route("post", path, resolver),
    patch: (path: string, resolver: RouteResolver) => route("patch", path, resolver),
    put: (path: string, resolver: RouteResolver) => route("put", path, resolver),
    delete: (path: string, resolver: RouteResolver) => route("delete", path, resolver),
  };
};

export const deferred = <T = void>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

/** A storage backed by a map, which behaves like `localStorage` */
export const createMemoryStorage = (initial: Record<string, string> = {}) => {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
  };
};

/** Resolves after pending timers of zero delay, promises and microtasks have run */
export const flush = async (times = 5) => {
  for (let index = 0; index < times; index += 1) {
    // oxlint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
};

/** Subscribes to a query and resolves once its state matches */
export const waitForState = async <State>(
  query: { subscribe: (listener: () => void) => () => void; getSnapshot: () => State },
  predicate: (state: State) => boolean,
) => {
  if (predicate(query.getSnapshot())) {
    return query.getSnapshot();
  }
  return new Promise<State>((resolve) => {
    const unsubscribe = query.subscribe(() => {
      if (predicate(query.getSnapshot())) {
        unsubscribe();
        resolve(query.getSnapshot());
      }
    });
  });
};
