/**
 * Generator for type stress test files.
 * Run: npx ts-node packages/core/__tests__/type-stress/generate-stress-test.ts
 */
import * as fs from "fs";
import * as path from "path";

const COUNT = 500;

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const endpoints = [
  "/users",
  "/users/:userId",
  "/users/:userId/posts",
  "/users/:userId/posts/:postId",
  "/products",
  "/products/:productId",
  "/orders/:orderId/items/:itemId",
  "/auth/login",
  "/auth/register",
  "/settings",
];

const lines: string[] = [];

lines.push(`// Auto-generated stress test — ${COUNT} typed requests`);
lines.push(`import { createClient } from "../../src";`);
lines.push(``);
lines.push(`const client = createClient({ url: "https://api.test.com" });`);
lines.push(``);

for (let i = 0; i < COUNT; i += 1) {
  const method = methods[i % methods.length];
  const endpoint = endpoints[i % endpoints.length];
  const hasPayload = method !== "GET" && method !== "DELETE";
  const hasQueryParams = i % 3 === 0;

  const generics: string[] = [];
  generics.push(`response: { id: number; name: string; index: ${i} }`);
  if (hasPayload) {
    generics.push(`payload: { value: string; count: ${i} }`);
  }
  if (hasQueryParams) {
    generics.push(`queryParams: { page: number; limit: number }`);
  }

  lines.push(
    `const req${i} = client.createRequest<{ ${generics.join("; ")} }>()({ endpoint: "${endpoint}" as const, method: "${method}" as const });`,
  );
}

lines.push(``);
lines.push(`// Exercise .send() types for a subset`);
for (let i = 0; i < 50; i += 1) {
  const idx = i * 10;
  lines.push(`type Send${idx} = ReturnType<typeof req${idx}.send>;`);
}

lines.push(``);
lines.push(`// Exercise .setParams() types`);
for (let i = 0; i < 50; i += 1) {
  const idx = i * 10 + 1;
  if (idx < COUNT) {
    lines.push(`const withParams${idx} = req${idx}.setParams({ userId: "1" } as any);`);
  }
}

lines.push(``);
lines.push(`// Exercise .clone() types`);
for (let i = 0; i < 50; i += 1) {
  const idx = i * 10 + 2;
  if (idx < COUNT) {
    lines.push(`const cloned${idx} = req${idx}.clone();`);
  }
}

lines.push(``);
lines.push(`// Exercise .toJSON() types`);
for (let i = 0; i < 50; i += 1) {
  const idx = i * 10 + 3;
  if (idx < COUNT) {
    lines.push(`const json${idx} = req${idx}.toJSON();`);
  }
}

lines.push(``);
lines.push(`export { };`);

const outPath = path.join(__dirname, "stress-test-500.ts");
fs.writeFileSync(outPath, lines.join("\n"));
// eslint-disable-next-line no-console
console.log(`Generated ${outPath} with ${COUNT} requests`);
