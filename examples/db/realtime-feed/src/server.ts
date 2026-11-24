import { getTeamPosts, type Post, socket, updatePost } from "./db";

/**
 * A fake backend made with HyperFetch mocking, so the example runs without a server. `setMock` replaces the adapter of
 * a request: the db sends the same requests it would send to a real API. The posts are kept in localStorage, so every
 * open tab sees the same data, like a real database.
 */
const STORAGE_KEY = "hyper-fetch-db-realtime-feed";

const minutesAgo = (minutes: number) => Date.now() - minutes * 60_000;

const seed: Post[] = [
  { id: "1", teamId: "design", author: "Ana", title: "New icon set is ready for review", likes: 3 },
  { id: "2", teamId: "design", author: "Ben", title: "Dark mode colors, round two", likes: 1 },
  { id: "3", teamId: "design", author: "Chloe", title: "Notes from the user interviews", likes: 5 },
  { id: "4", teamId: "platform", author: "Dev", title: "Staging moved to the new cluster", likes: 2 },
  { id: "5", teamId: "platform", author: "Eli", title: "Postmortem: Tuesday's slow builds", likes: 4 },
].map((post, index) => ({ ...post, createdAt: minutesAgo(50 - index * 10), updatedAt: minutesAgo(50 - index * 10) }));

const readPosts = (): Post[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : seed;
};

const writePosts = (posts: Post[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

/**
 * The server's side of the socket. A frame goes to every channel with this name, in this tab and in every other one.
 * The topic is the listener topic with its params filled in, as `query.explain().syncs` shows.
 */
const channel = new BroadcastChannel(socket.url);
const publish = (topic: string, data: unknown) => channel.postMessage({ topic, data });

// Slow enough to see a write on screen before the server answers.
const latency = { responseTime: 800 };

let failing = false;

/** While on, every write answers 500 and the db reverts the change. */
export const setServerFailing = (value: boolean) => {
  failing = value;
};

const serverError = () => ({ error: new Error("The server rejected the change"), status: 500 });

getTeamPosts.setMock(({ request }) => {
  const posts = readPosts().filter((post) => post.teamId === request.params?.teamId);
  return { data: posts, status: 200 };
}, latency);

updatePost.setMock(({ request }) => {
  const posts = readPosts();
  const post = posts.find((item) => item.id === request.params?.postId);
  if (failing || !post) return serverError();
  const updated = { ...post, ...request.payload, updatedAt: Date.now() };
  writePosts(posts.map((item) => (item.id === updated.id ? updated : item)));
  // Everyone else on the team sees the like too
  publish(`teams/${updated.teamId}/posts/changed`, {
    id: updated.id,
    likes: updated.likes,
    updatedAt: updated.updatedAt,
  });
  return { data: updated, status: 200 };
}, latency);

/* Changes made by "another user". They reach the app only through the socket, never through a response. */

const names = ["Fay", "Gus", "Hana", "Ivo"];
const titles = ["Lunch and learn on Friday", "Release 2.4 is out", "Who has the projector?", "New hire starts Monday"];
const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];
/** The team's newest post, the one at the top of the feed */
const newestPost = (posts: Post[], teamId: string) =>
  posts.filter((post) => post.teamId === teamId).sort((a, b) => b.createdAt - a.createdAt)[0];

export const simulateNewPost = (teamId: string) => {
  const now = Date.now();
  const post: Post = {
    id: crypto.randomUUID(),
    teamId,
    author: pick(names),
    title: pick(titles),
    likes: 0,
    createdAt: now,
    updatedAt: now,
  };
  writePosts([...readPosts(), post]);
  publish(`teams/${teamId}/posts/created`, post);
};

export const simulateRename = (teamId: string) => {
  const posts = readPosts();
  const post = newestPost(posts, teamId);
  if (!post) return;
  const changes = { id: post.id, title: `${post.title.replace(/ \(edited\)$/, "")} (edited)`, updatedAt: Date.now() };
  writePosts(posts.map((item) => (item.id === post.id ? { ...item, ...changes } : item)));
  publish(`teams/${teamId}/posts/changed`, changes);
};

export const simulateDelete = (teamId: string) => {
  const posts = readPosts();
  const post = newestPost(posts, teamId);
  if (!post) return;
  writePosts(posts.filter((item) => item.id !== post.id));
  publish(`teams/${teamId}/posts/deleted`, { id: post.id });
};
