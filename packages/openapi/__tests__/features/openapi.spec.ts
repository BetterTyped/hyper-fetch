/**
 * @jest-environment node
 */

import { Document } from "openapi-client-axios";

import { generateSchemaTypes } from "../../src/generator/parser";
import { findPets } from "./test-types";

export enum HttpMethod {
  Get = "get",
  Put = "put",
  Post = "post",
  Patch = "patch",
  Delete = "delete",
  Options = "options",
  Head = "head",
  Trace = "trace",
}

describe("IT SHOULD WORK", () => {
  it("should allow for work with openapi", async () => {
    const file = await import("./petstore-expanded.json");
    const { data } = await findPets.send();
  });
});
