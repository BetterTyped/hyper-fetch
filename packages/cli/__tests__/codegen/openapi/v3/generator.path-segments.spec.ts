/**
 * @vitest-environment node
 */
import { createClient } from "@hyper-fetch/core";
import type { RequestInstance } from "@hyper-fetch/core";
import { OpenapiRequestGenerator } from "codegen/openapi";
import * as fs from "fs-extra";
import * as path from "node:path";

const okResponse = {
  "200": { description: "ok", content: { "application/json": { schema: { type: "array", items: { type: "string" } } } } },
};

const schema = {
  openapi: "3.0.0",
  info: { title: "Path segments", version: "1.0.0" },
  paths: {
    "/pet/findByStatus": { get: { operationId: "findPetsByStatus", responses: okResponse } },
    "/user-profiles": { get: { operationId: "listUserProfiles", responses: okResponse } },
    "/user-profiles/{profileId}/avatarImage": {
      get: {
        operationId: "getAvatarImage",
        parameters: [{ name: "profileId", in: "path", required: true, schema: { type: "string" } }],
        responses: okResponse,
      },
    },
    "/store/inventory": { get: { operationId: "getInventory", responses: okResponse } },
  },
};

type GeneratedSdk = Record<string, any>;

describe("Generator [ Path segments ]", () => {
  const outputDirectory = path.join(__dirname, "../__temp__/path-segments");
  let sdk: GeneratedSdk;

  beforeAll(async () => {
    const generator = new OpenapiRequestGenerator(schema);
    const generatedPath = await generator.generateFile({
      config: {
        tsx: true,
        aliases: { api: "api", hooks: "hooks", ui: "ui", components: "components", lib: "lib" },
        resolvedPaths: {
          cwd: __dirname,
          api: outputDirectory,
          hooks: outputDirectory,
          ui: outputDirectory,
          components: outputDirectory,
          lib: outputDirectory,
        },
      },
      fileName: "path-segments.client",
    });
    const generated: { createSdk: (client: unknown) => GeneratedSdk } = await import(generatedPath);
    sdk = generated.createSdk(createClient({ url: "http://petstore.test" }));
  });

  afterAll(() => {
    fs.removeSync(outputDirectory);
  });

  const getEndpoint = (request: RequestInstance) => request.endpoint;

  it("should call the camelCase path of the schema", () => {
    expect(getEndpoint(sdk.pet.findByStatus.$get)).toBe("/pet/findByStatus");
  });

  it("should call the kebab-case path of the schema with the camelCase key", () => {
    expect(getEndpoint(sdk.userProfiles.$get)).toBe("/user-profiles");
  });

  it("should map every segment of a mixed path", () => {
    expect(getEndpoint(sdk.userProfiles.$profileId.avatarImage.$get.setParams({ profileId: "7" }))).toBe(
      "/user-profiles/7/avatarImage",
    );
  });

  it("should keep the plain segments", () => {
    expect(getEndpoint(sdk.store.inventory.$get)).toBe("/store/inventory");
  });
});
