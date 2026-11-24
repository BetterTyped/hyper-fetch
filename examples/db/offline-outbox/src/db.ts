import { createClient } from "@hyper-fetch/core";
import { collection, createDb } from "@hyper-fetch/db";
import { z } from "zod";

/** The base URL is never reached: `server.ts` answers every request with `setMock`. */
export const client = createClient({ url: "https://api.example.com" });

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
});
export type Project = z.infer<typeof ProjectSchema>;

const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  done: z.boolean(),
  createdAt: z.number(),
});
export type Task = z.infer<typeof TaskSchema>;

/** Every write carries the id of the outbox record, so the server can ignore a write it already applied. */
type Idempotent = { idempotencyKey: string };

export const getProjects = client.createRequest<{ response: Project[] }>()({ endpoint: "/projects" });

export const createProject = client.createRequest<{ response: Project; payload: Project & Idempotent }>()({
  endpoint: "/projects",
  method: "POST",
});

export const getTasks = client.createRequest<{ response: Task[] }>()({ endpoint: "/tasks" });

export const createTask = client.createRequest<{ response: Task; payload: Task & Idempotent }>()({
  endpoint: "/tasks",
  method: "POST",
});

export const updateTask = client.createRequest<{ response: Task; payload: Partial<Task> & Idempotent }>()({
  endpoint: "/tasks/:taskId",
  method: "PATCH",
});

/**
 * `map` gets the write's id as `context.id`. The outbox marks a write as sent before the request goes out, and sends it
 * again after a reload, so the id is sent with every write.
 */
const Project = collection(ProjectSchema, { key: "id" })
  .load(getProjects)
  .mutate({
    insert: { request: createProject, map: (row, { id }) => ({ payload: { ...row, idempotencyKey: id } }) },
  });

const Task = collection(TaskSchema, { key: "id" })
  .load(getTasks)
  .mutate({
    insert: { request: createTask, map: (row, { id }) => ({ payload: { ...row, idempotencyKey: id } }) },
    update: {
      request: updateTask,
      map: (key, changes, { id }) => ({ params: { taskId: key }, payload: { ...changes, idempotencyKey: id } }),
    },
  });

/**
 * `offline` sends every write through the outbox, online or not. `persistence` keeps the rows and the outbox in
 * `localStorage`, so a reload shows the saved rows at once and still holds the writes that were not sent yet.
 */
export const db = createDb(
  { project: Project, task: Task },
  {
    offline: true,
    persistence: { storage: localStorage, scope: "demo", version: 1 },
  },
);
