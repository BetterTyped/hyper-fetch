import { node } from "@elysiajs/node";
import type { ElysiaAppToHyperFetch } from "@hyper-fetch/elysia";
import { Elysia, t } from "elysia";

export type Bookmark = {
  id: number;
  title: string;
  url: string;
  tag: "docs" | "tools";
};

// In memory, so the data resets when the server restarts.
let nextId = 4;
let bookmarks: Bookmark[] = [
  { id: 1, title: "Elysia", url: "https://elysiajs.com", tag: "docs" },
  {
    id: 2,
    title: "HyperFetch",
    url: "https://hyperfetch.bettertyped.com",
    tag: "docs",
  },
  { id: 3, title: "Vite", url: "https://vite.dev", tag: "tools" },
];

const tag = t.Union([t.Literal("docs"), t.Literal("tools")]);

// Routes must be chained: Elysia only types the routes of one chain.
export const app = new Elysia({ adapter: node(), prefix: "/api" })
  // The `query` schema types `setQueryParams()` on the client.
  .get("/bookmarks", ({ query }) => (query.tag ? bookmarks.filter((item) => item.tag === query.tag) : bookmarks), {
    query: t.Object({ tag: t.Optional(tag) }),
  })
  // The `body` schema types the payload. Invalid input is rejected with a typed 422 before the handler runs.
  .post(
    "/bookmarks",
    ({ body, status }) => {
      const bookmark: Bookmark = { id: nextId++, ...body };
      bookmarks = [bookmark, ...bookmarks];
      return status(201, bookmark);
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        url: t.String({ format: "uri" }),
        tag,
      }),
    },
  )
  .delete("/bookmarks/:bookmarkId", ({ params, status }) => {
    const id = Number(params.bookmarkId);
    if (!bookmarks.some((item) => item.id === id)) {
      // A non-2xx status types the local error of the request.
      return status(404, { message: `Bookmark ${id} was already deleted` });
    }
    bookmarks = bookmarks.filter((item) => item.id !== id);
    return { id };
  });

/** The schema type for `createSdk`. The client imports only this type, never the server code. */
export type AppSchema = ElysiaAppToHyperFetch<typeof app>;
