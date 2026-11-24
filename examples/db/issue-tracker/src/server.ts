import { getIssue, getIssues, getUsers, type Issue, priorities, socket, statuses, updateIssue, type User } from "./db";

/**
 * A fake backend made with HyperFetch mocking, so the example runs without a server. `setMock` replaces the adapter of
 * a request: the db sends the same requests it would send to a real API. Issues are kept in localStorage, so every tab
 * sees the same data, and changes are published on the socket's `BroadcastChannel`, so every tab hears about them.
 */
const STORAGE_KEY = "hyper-fetch-db-issue-tracker";

const users: User[] = [
  { id: "u1", name: "Ada" },
  { id: "u2", name: "Grace" },
  { id: "u3", name: "Alan" },
  { id: "u4", name: "Margaret" },
  { id: "u5", name: "Edsger" },
];

const titles = [
  "Login form forgets the email after an error",
  "Dark mode toggle flickers on load",
  "Add keyboard shortcuts to the board",
  "Avatar upload fails for PNG files",
  "Search ignores accented letters",
  "Settings page is slow on mobile",
  "Show unread count in the tab title",
  "Date picker starts weeks on Sunday",
  "Empty state for projects without issues",
  "Copy link button does nothing in Safari",
  "Sidebar collapses after every reload",
  "Export the board as CSV",
  "Toast messages cover the save button",
  "Drag and drop skips the last column",
  "Onboarding tour points at the wrong menu",
  "Remember the last opened project",
  "Markdown tables render without borders",
  "Notifications arrive twice",
  "Logout does not clear the drafts",
  "Long titles break the issue card",
  "Filter chips wrap badly on small screens",
  "Invite email links to the old domain",
  "Two-factor setup needs a QR fallback",
  "Profile page shows a stale avatar",
  "Rate limit headers are missing",
  "Pagination cursor expires too early",
  "Webhook retries ignore Retry-After",
  "OpenAPI spec lists a removed field",
  "PATCH accepts unknown fields silently",
  "Issue search times out on large projects",
  "Add an endpoint for bulk status changes",
  "Timestamps lose milliseconds",
  "Error responses use two different shapes",
  "API keys cannot be rotated",
  "Deleted users still show as assignees",
  "Return 404 instead of 500 for unknown issues",
  "Document the socket topics",
  "Health check reports the wrong version",
  "CORS preflight fails for PATCH",
  "Add ETag headers to issue reads",
];

/** 40 issues: the first 24 in the web project, the rest in the API project */
const seed = (): Issue[] =>
  titles.map((title, index) => ({
    id: `ISS-${index + 1}`,
    projectId: index < 24 ? "web" : "api",
    title,
    status: statuses[index % statuses.length],
    priority: priorities[(index * 3) % priorities.length],
    assigneeId: index % 6 === 5 ? null : users[index % users.length].id,
    description: `Found while testing the ${index < 24 ? "web app" : "public API"}. The list endpoint never returns this text: it loads with the full issue.`,
    updatedAt: Date.UTC(2026, 10, 1) - index * 3_600_000,
  }));

const readIssues = (): Issue[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : seed();
};

const writeIssues = (issues: Issue[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));

/** Puts the 40 seed issues back, for every tab */
export const resetServer = () => writeIssues(seed());

// Slow enough to see what shows before the server answers.
const latency = { responseTime: 600 };

let failing = false;

/** While on, every write answers 500 and the db reverts the change. */
export const setServerFailing = (value: boolean) => {
  failing = value;
};

/** A log of what reached the server, so the app can show which filters were sent */
type LogListener = (line: string) => void;
const logListeners = new Set<LogListener>();

export const log = (line: string) => logListeners.forEach((listener) => listener(line));

export const subscribeToLog = (listener: LogListener) => {
  logListeners.add(listener);
  return () => {
    logListeners.delete(listener);
  };
};

/** Publishes an event the way a real backend would, to every subscriber of the topic, in every tab */
const channel = new BroadcastChannel(socket.url);

/** Stores an issue and publishes it whole on its project's topic, as `onIssueSaved` expects */
const save = (issue: Issue) => {
  const issues = readIssues();
  const exists = issues.some((item) => item.id === issue.id);
  writeIssues(exists ? issues.map((item) => (item.id === issue.id ? issue : item)) : [...issues, issue]);
  channel.postMessage({ topic: `projects/${issue.projectId}/issues/saved`, data: issue });
};

const toSummary = ({ description, ...summary }: Issue) => summary;

getIssues.setMock(({ request }) => {
  const projectId = request.params?.projectId;
  const status = request.queryParams?.status;
  log(`GET /projects/${projectId}/issues${status ? `?status=${status}` : ""}`);
  const issues = readIssues().filter((issue) => issue.projectId === projectId && (!status || issue.status === status));
  return { data: issues.map(toSummary), status: 200 };
}, latency);

getIssue.setMock(({ request }) => {
  const issueId = request.params?.issueId;
  log(`GET /issues/${issueId}`);
  const issue = readIssues().find((item) => item.id === issueId);
  return issue ? { data: issue, status: 200 } : { error: new Error("Issue not found"), status: 404 };
}, latency);

getUsers.setMock(({ request }) => {
  const ids = request.queryParams?.ids;
  log(`GET /users${ids ? `?ids=${ids.join(",")}` : ""}`);
  return {
    data: ids ? users.filter((user) => ids.includes(user.id)) : users,
    status: 200,
  };
}, latency);

updateIssue.setMock(({ request }) => {
  const issueId = request.params?.issueId;
  const issue = readIssues().find((item) => item.id === issueId);
  if (failing || !issue) {
    log(`PATCH /issues/${issueId} 500`);
    return { error: new Error("The server rejected the change"), status: 500 };
  }
  log(`PATCH /issues/${issueId} ${JSON.stringify(request.payload)}`);
  const updated: Issue = { ...issue, ...request.payload, updatedAt: Date.now() };
  // Every tab hears about the change, this one included
  save(updated);
  return { data: updated, status: 200 };
}, latency);

const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

/**
 * A teammate changes an issue somewhere else. Most of the time they move one to another status and assign it to
 * someone. Sometimes they file a new issue. Either way the server only publishes an event: nothing is refetched.
 */
export const simulateTeammate = (projectId: string) => {
  const teammate = pick(users);
  const issues = readIssues();

  if (Math.random() < 0.25) {
    const number = Math.max(...issues.map((issue) => Number(issue.id.slice(4)))) + 1;
    const title = pick(["Crash when the network drops", "Typo in the welcome email", "Button is hard to reach"]);
    const created: Issue = {
      id: `ISS-${number}`,
      projectId,
      title,
      status: "todo",
      priority: pick(priorities),
      assigneeId: teammate.id,
      description: `Filed by ${teammate.name}.`,
      updatedAt: Date.now(),
    };
    log(`${teammate.name} filed ${created.id} in todo`);
    save(created);
    return;
  }

  const issue = pick(issues.filter((item) => item.projectId === projectId));
  const status = pick(statuses.filter((item) => item !== issue.status));
  log(`${teammate.name} moved ${issue.id} from ${issue.status} to ${status}`);
  save({ ...issue, status, assigneeId: teammate.id, updatedAt: Date.now() });
};
