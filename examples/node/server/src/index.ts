import { client, getStatus, getUserPosts, getUsers } from "./api.js";

const started = performance.now();
const log = (message: string) =>
  console.log(`${`${Math.round(performance.now() - started)}ms`.padStart(7)}  ${message}`);

console.log(`HyperFetch on ${process.release.name} ${process.version}, client mode: ${client.mode}\n`);

// 1. A typed request. `send()` never throws: the result holds either `data` or `error`.
const { data, error, status } = await getUsers.send();
if (!data) {
  console.error("Could not load users:", error?.message);
  process.exit(1);
}
const { users } = data;
log(`GET /users -> ${status}, ${users.map((user) => `${user.firstName} ${user.lastName}`).join(", ")}`);

// 2. Parallel requests: one per user, all in flight at once.
log(`Fetching the posts of ${users.length} users in parallel`);
const posts = await Promise.all(
  users.map((user) => getUserPosts.setParams({ userId: user.id }).setQueryParams({ limit: 2, select: "title" }).send()),
);
posts.forEach((response, index) => {
  const titles = response.data?.posts.map((post) => `"${post.title}"`).join(", ") || response.error?.message || "none";
  log(`  ${users[index].firstName}: ${response.data?.total ?? 0} posts, ${titles}`);
});

// 3. Retries: a 503 is sent 1 + 2 times, a 404 only once because `setRetryOnError` skips client errors.
for (const code of [503, 404]) {
  let attempts = 0;
  const response = await getStatus.setParams({ status: code }).send({
    onRequestStart: () => {
      attempts += 1;
      log(`GET /http/${code}, attempt ${attempts}`);
    },
  });
  log(`  -> ${response.status} "${response.error?.message}" after ${attempts} attempt(s)`);
}
