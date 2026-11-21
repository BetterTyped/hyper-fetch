import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

export type Notification = { id: number; title: string; body: string; read: boolean; createdAt: string };

const templates = [
  { title: "New comment", body: "Ada replied to your post." },
  { title: "Build passed", body: "main is green again." },
  { title: "Mention", body: "Linus mentioned you in #general." },
  { title: "Invoice paid", body: "Invoice #1042 was paid." },
  { title: "New follower", body: "Grace started following you." },
  { title: "Deploy finished", body: "Version 2.4.0 is live." },
];

// In memory, so the data resets when the dev server restarts.
let nextId = 1;
let notifications: Notification[] = [];

const create = () => {
  const template = templates[Math.floor(Math.random() * templates.length)];
  const notification: Notification = { id: nextId++, ...template, read: false, createdAt: new Date().toISOString() };
  notifications = [notification, ...notifications].slice(0, 50);
  return notification;
};

// Two to start with.
create();
create();

// ---------- Push ----------

const subscribers = new Set<(notification: Notification) => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

// A new notification every 2 to 6 seconds while at least one tab listens.
const scheduleNext = () => {
  timer = setTimeout(
    () => {
      const notification = create();
      subscribers.forEach((send) => send(notification));
      scheduleNext();
    },
    2000 + Math.random() * 4000,
  );
};

const app = new Hono()
  .basePath("/api")
  .get("/notifications", (c) => c.json(notifications.slice(0, 10)))
  .post("/notifications/:id/read", (c) => {
    const notification = notifications.find((item) => item.id === Number(c.req.param("id")));
    if (!notification) return c.json({ message: "No such notification" }, 404);
    notification.read = true;
    return c.json(notification);
  })
  .post("/notifications/read-all", (c) => {
    notifications.forEach((item) => {
      item.read = true;
    });
    return c.json({ ok: true });
  })
  // Each new notification is sent as a named event, `event: notification`.
  .get("/events", (c) =>
    streamSSE(c, async (stream) => {
      const send = (notification: Notification) =>
        void stream.writeSSE({ event: "notification", data: JSON.stringify(notification) });
      subscribers.add(send);
      if (!timer) scheduleNext();

      stream.onAbort(() => {
        subscribers.delete(send);
        if (subscribers.size === 0) {
          clearTimeout(timer);
          timer = undefined;
        }
      });

      // Keep the response open. A comment line every 15 s keeps proxies from closing an idle stream.
      while (!stream.aborted) {
        await stream.sleep(15000);
        await stream.write(": ping\n\n");
      }
    }),
  );

// `@hono/vite-dev-server` serves the default export inside the Vite dev server.
export default app;
