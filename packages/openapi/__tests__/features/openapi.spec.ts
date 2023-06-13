/**
 * @jest-environment node
 */

import { Document } from "openapi-client-axios";

import { generateRequestsFromSchema } from "../../src/openapi/generator";

describe("IT SHOULD WORK", () => {
  it("should allow for work with openapi", async () => {
    const file = await import("./petstore-expanded.json");
    await generateRequestsFromSchema(file as Document);
  });
});
