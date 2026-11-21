import type { HonoSchema } from "@hyper-fetch/hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

export type Note = { id: number; text: string; createdAt: string };

// In memory, so the data resets when the dev server restarts.
let nextId = 3;
let notes: Note[] = [
  { id: 1, text: "The API lives in server/app.ts", createdAt: new Date().toISOString() },
  { id: 2, text: "Its types reach the client without codegen", createdAt: new Date().toISOString() },
];

// Routes must be chained: Hono only types the routes of one chain.
const app = new Hono()
  .basePath("/api")
  .get("/notes", (c) => c.json(notes))
  .post(
    "/notes",
    // The validator output types the payload of the request on the client.
    validator("json", (value: { text?: unknown }) => {
      const text = typeof value.text === "string" ? value.text.trim() : "";
      if (!text) throw new HTTPException(400, { message: "Write something first" });
      return { text };
    }),
    (c) => {
      const note: Note = { id: nextId++, text: c.req.valid("json").text, createdAt: new Date().toISOString() };
      notes = [note, ...notes];
      return c.json(note, 201);
    },
  )
  .delete("/notes/:noteId", (c) => {
    const id = Number(c.req.param("noteId"));
    notes = notes.filter((note) => note.id !== id);
    return c.json({ id });
  })
  // Errors are sent as `{ message }`, the error type of the HyperFetch client.
  .onError((error, c) => c.json({ message: error.message }, error instanceof HTTPException ? error.status : 500));

/** The schema type for `createSdk`. The client imports only this type, never the server code. */
export type AppSchema = HonoSchema<typeof app>;

// `@hono/vite-dev-server` serves the default export inside the Vite dev server.
export default app;
