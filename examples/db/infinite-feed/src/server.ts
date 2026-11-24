import { getPosts, type Post, socket, updatePost } from "./db";

/**
 * A fake backend made with HyperFetch mocking, so the example runs without a server. `setMock` replaces the adapter of
 * a request: the db sends the same requests it would send to a real API. The posts are kept in localStorage, so every
 * open tab sees the same data, like a real database.
 */
const STORAGE_KEY = "hyper-fetch-db-infinite-feed";

/** The backend's page size. The app shows pages of its own size, independent of this one. */
const BACKEND_PAGE_SIZE = 15;

const authors = ["Ana", "Ben", "Chloe", "Dev", "Eli", "Fay"];

const seed: Post[] = Array.from({ length: 60 }, (_, index) => ({
  id: `seed-${index + 1}`,
  author: authors[index % authors.length],
  body: `Post number ${60 - index} of the seeded feed`,
  likes: (index * 7) % 5,
  createdAt: Date.now() - (index + 1) * 5 * 60_000,
}));

const readPosts = (): Post[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : seed;
};

const writePosts = (posts: Post[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

/** The server's side of the socket. A frame goes to every channel with this name, in this tab and in every other one. */
const channel = new BroadcastChannel(socket.url);
const publish = (topic: string, data: unknown) => channel.postMessage({ topic, data });

/** Lets the app show each request the server answers */
const logListeners = new Set<(line: string) => void>();
export const onServerLog = (listener: (line: string) => void) => {
  logListeners.add(listener);
  return () => {
    logListeners.delete(listener);
  };
};
const log = (line: string) => logListeners.forEach((listener) => listener(line));

// Slow enough to see a page load and a like on screen before the server answers.
const latency = { responseTime: 800 };

let failing = false;

/** While on, every write answers 500 and the db reverts the change. */
export const setServerFailing = (value: boolean) => {
  failing = value;
};

const serverError = () => ({ error: new Error("The server rejected the change"), status: 500 });

getPosts.setMock(({ request }) => {
  const { sort = "createdAt:desc", cursor } = request.queryParams ?? {};
  const direction = sort.endsWith(":asc") ? 1 : -1;
  const sorted = readPosts().sort((a, b) => (a.createdAt - b.createdAt) * direction);
  // The cursor is the `createdAt` of the last post sent, so the page starts after it
  const start = cursor ? sorted.findIndex((post) => (post.createdAt - Number(cursor)) * direction > 0) : 0;
  const items = start === -1 ? [] : sorted.slice(start, start + BACKEND_PAGE_SIZE);
  const last = items.at(-1);
  const next = last && start + items.length < sorted.length ? String(last.createdAt) : null;
  log(`GET /posts?sort=${sort}${cursor ? `&cursor=${cursor}` : ""}: ${items.length} posts`);
  return { data: { items, next }, status: 200 };
}, latency);

updatePost.setMock(({ request }) => {
  const posts = readPosts();
  const post = posts.find((item) => item.id === request.params?.postId);
  if (failing || !post) {
    log(`PATCH /posts/${request.params?.postId}: 500`);
    return serverError();
  }
  const updated = { ...post, ...request.payload };
  writePosts(posts.map((item) => (item.id === updated.id ? updated : item)));
  // Other tabs see the like through the socket
  publish("posts/changed", { id: updated.id, likes: updated.likes });
  log(`PATCH /posts/${updated.id}: 200`);
  return { data: updated, status: 200 };
}, latency);

/** A post by "another user". It reaches the app only through the socket, never through a response. */
export const simulateNewPost = () => {
  const post: Post = {
    id: crypto.randomUUID(),
    author: authors[Math.floor(Math.random() * authors.length)],
    body: "Fresh from another user",
    likes: 0,
    createdAt: Date.now(),
  };
  writePosts([...readPosts(), post]);
  publish("posts/created", post);
  log(`Socket posts/created: a post by ${post.author}`);
};
