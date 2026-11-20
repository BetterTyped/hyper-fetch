import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

export type OrderStatus = "new" | "packing" | "shipped" | "delivered";
export type Order = { id: number; customer: string; total: number; status: OrderStatus; updatedAt: string };
export type OrderEvent = { type: "created" | "updated"; order: Order };

const flow: OrderStatus[] = ["new", "packing", "shipped", "delivered"];
const customers = ["Ada", "Grace", "Linus", "Margaret", "Ken", "Barbara", "Dennis"];

// In memory, so the data resets when the dev server restarts.
let nextId = 4;
const orders: Order[] = [
  { id: 3, customer: "Ada", total: 120, status: "new", updatedAt: new Date().toISOString() },
  { id: 2, customer: "Grace", total: 64, status: "packing", updatedAt: new Date().toISOString() },
  { id: 1, customer: "Linus", total: 245, status: "shipped", updatedAt: new Date().toISOString() },
];

// ---------- Fan-out to every open event stream ----------

const subscribers = new Set<(event: OrderEvent) => void>();
const publish = (event: OrderEvent) => subscribers.forEach((send) => send(event));

const advance = (order: Order) => {
  order.status = flow[Math.min(flow.indexOf(order.status) + 1, flow.length - 1)];
  order.updatedAt = new Date().toISOString();
  publish({ type: "updated", order });
  return order;
};

// Other "users" work on the orders too: something changes every few seconds while anyone is watching.
let timer: ReturnType<typeof setInterval> | undefined;
const simulateActivity = () => {
  const open = orders.filter((order) => order.status !== "delivered");
  if (open.length < 2 || Math.random() < 0.3) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const order: Order = {
      id: nextId++,
      customer,
      total: 20 + Math.round(Math.random() * 300),
      status: "new",
      updatedAt: new Date().toISOString(),
    };
    orders.unshift(order);
    publish({ type: "created", order });
  } else {
    advance(open[Math.floor(Math.random() * open.length)]);
  }
};

const app = new Hono()
  .basePath("/api")
  .get("/orders", (c) => c.json(orders.slice(0, 8)))
  .post("/orders/:orderId/advance", (c) => {
    const order = orders.find((item) => item.id === Number(c.req.param("orderId")));
    if (!order) return c.json({ message: "No such order" }, 404);
    return c.json(advance(order));
  })
  // One stream per browser tab. Each change is sent as a named event, `event: order`.
  .get("/events", (c) =>
    streamSSE(c, async (stream) => {
      const send = (event: OrderEvent) => void stream.writeSSE({ event: "order", data: JSON.stringify(event) });
      subscribers.add(send);
      timer ??= setInterval(simulateActivity, 3000);

      stream.onAbort(() => {
        subscribers.delete(send);
        if (subscribers.size === 0) {
          clearInterval(timer);
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
