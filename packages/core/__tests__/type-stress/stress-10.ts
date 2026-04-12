import { createClient } from "../../src";

const client = createClient({ url: "https://api.test.com" });
const r0 = client.createRequest<{ response: { id: 0 } }>()({ endpoint: "/a" as const, method: "GET" as const });
const r1 = client.createRequest<{ response: { id: 1 }; payload: { v: string } }>()({
  endpoint: "/b/:id" as const,
  method: "POST" as const,
});
const r2 = client.createRequest<{ response: { id: 2 }; queryParams: { q: string } }>()({
  endpoint: "/c" as const,
  method: "GET" as const,
});
const r3 = client.createRequest<{ response: { id: 3 }; payload: { v: number }; queryParams: { p: number } }>()({
  endpoint: "/d/:x/:y" as const,
  method: "PUT" as const,
});
const r4 = client.createRequest<{ response: { id: 4 } }>()({ endpoint: "/e" as const, method: "DELETE" as const });
const r5 = client.createRequest<{ response: { id: 5 }; payload: { v: boolean } }>()({
  endpoint: "/f/:id" as const,
  method: "PATCH" as const,
});
const r6 = client.createRequest<{ response: { id: 6 } }>()({ endpoint: "/g" as const, method: "GET" as const });
const r7 = client.createRequest<{ response: { id: 7 }; payload: { v: string[] } }>()({
  endpoint: "/h/:a/:b/:c" as const,
  method: "POST" as const,
});
const r8 = client.createRequest<{ response: { id: 8 }; queryParams: { s: string; n: number } }>()({
  endpoint: "/i" as const,
  method: "GET" as const,
});
const r9 = client.createRequest<{ response: { id: 9 }; payload: { v: Record<string, any> } }>()({
  endpoint: "/j/:id" as const,
  method: "PUT" as const,
});
export { r0, r1, r2, r3, r4, r5, r6, r7, r8, r9 };
