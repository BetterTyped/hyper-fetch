// Minimal stress test — just createRequest + send to trace per-request cost
import { createClient } from "../../src";

const client = createClient({ url: "https://api.test.com" });

// Single request with all features to see full type chain
const req = client.createRequest<{
  response: { id: number; name: string };
  payload: { value: string };
  queryParams: { page: number; limit: number };
}>()({
  endpoint: "/users/:userId/posts/:postId" as const,
  method: "POST" as const,
});

// Exercise the full type chain
type SendType = ReturnType<typeof req.send>;
const withParams = req.setParams({ userId: "1", postId: "2" });
const cloned = req.clone();
const json = req.toJSON();

export { req, withParams, cloned, json };
export type { SendType };
