import { createClient } from "@hyper-fetch/core";
import { collection, createDb } from "@hyper-fetch/db";
import { Socket } from "@hyper-fetch/sockets";
import { z } from "zod";

import { BroadcastChannelAdapter } from "./broadcast-adapter";

/** The base URL is never reached: `server.ts` answers every request with `setMock`. */
export const client = createClient({ url: "https://api.example.com" });

/** Realtime events travel over a `BroadcastChannel` named after the URL, so every open tab receives them. */
export const socket = new Socket({ url: "hyper-fetch-issue-tracker", adapter: BroadcastChannelAdapter() });

export const statuses = ["backlog", "todo", "in_progress", "done"] as const;
export const priorities = ["low", "medium", "high", "urgent"] as const;
export const projects = [
  { id: "web", name: "Web app" },
  { id: "api", name: "Public API" },
];

const UserSchema = z.object({ id: z.string(), name: z.string() });
export type User = z.infer<typeof UserSchema>;

/** What the list endpoint returns: everything except the description */
const IssueSummarySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  assigneeId: z.string().nullable(),
  updatedAt: z.number(),
});
export type IssueSummary = z.infer<typeof IssueSummarySchema>;
export type Status = IssueSummary["status"];

/** What the detail endpoint returns: the full issue */
const IssueSchema = IssueSummarySchema.extend({ description: z.string() });
export type Issue = z.infer<typeof IssueSchema>;

// Requests: the same ones you would write without the db

export const getIssues = client.createRequest<{ response: IssueSummary[]; queryParams?: { status?: Status } }>()({
  endpoint: "/projects/:projectId/issues",
});

export const getIssue = client.createRequest<{ response: Issue }>()({ endpoint: "/issues/:issueId" });

export const updateIssue = client.createRequest<{ response: Issue; payload: Partial<Issue> }>()({
  endpoint: "/issues/:issueId",
  method: "PATCH",
});

/** Every user, or only the ones in `ids` */
export const getUsers = client.createRequest<{ response: User[]; queryParams?: { ids?: string[] } }>()({
  endpoint: "/users",
});

/** The server publishes the full issue on its project's topic whenever one is created or changed */
export const onIssueSaved = socket.createListener<Issue>()({ topic: "projects/:projectId/issues/saved" });

/** Fills the `:projectId` of the topic from the project a query or a row belongs to */
const byProject = { projectId: { eq: (projectId: string) => ({ params: { projectId } }) } };

/**
 * List rows. The loader sends `projectId` in the URL and `status` as a query param. Every other condition runs on the
 * rows the db holds.
 *
 * The sync is an `insert`: each event is a complete row that creates or replaces the stored one. A list only holds the
 * rows of its filter, so an issue moved into "Todo" somewhere else must arrive whole to join it. An `update` event only
 * changes rows the db already holds.
 */
const IssueSummary = collection(IssueSummarySchema, { key: "id", version: "updatedAt" })
  .load(getIssues, {
    where: {
      projectId: { eq: (projectId) => ({ params: { projectId } }), required: true },
      status: { eq: (status) => ({ queryParams: { status } }) },
    },
  })
  // List rows have no description, so the mapping drops it
  .sync(onIssueSaved, { type: "insert", where: byProject, row: ({ description, ...summary }) => summary });

/** Full issues, read one at a time for the detail panel. Edits go through this collection. */
const Issue = collection(IssueSchema, { key: "id", version: "updatedAt" })
  .load(getIssue, { byKey: (id) => ({ params: { issueId: id } }) })
  // Changes the open issue. Issues nobody opened are not stored, so their events are ignored.
  .sync(onIssueSaved, { type: "update", where: byProject })
  .mutate({
    update: { request: updateIssue, map: (key, changes) => ({ params: { issueId: key }, payload: changes }) },
  });

/** Users: the whole team for pickers, or a batch by id for the assignees a list shows */
const User = collection(UserSchema, { key: "id" })
  .load(getUsers)
  .load(getUsers, { byKeys: (ids) => ({ queryParams: { ids } }) });

/**
 * The link says `issue` and `issueSummary` hold the same records. An edit of a full issue changes the list row at once,
 * and a failed edit reverts both.
 */
export const db = createDb(
  { issueSummary: IssueSummary, issue: Issue, user: User },
  { links: [["issue", "issueSummary"]] },
);
