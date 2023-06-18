import { promises as fsPromises } from "fs";
import path from "path";

import { getBaseUrl, isUrl, normalizeOperationId } from "../../src/openapi/utils";
import { Document } from "../../src";

describe("Utils", () => {
  it("should check if provided path is url or not", () => {
    const urlPath = "https://petstore3.swagger.io/api/v3/openapi.json";
    const localpath = "./petstore.json";
    expect(isUrl(urlPath)).toBe(true);
    expect(isUrl(localpath)).toBe(false);
  });

  it("should normalize operation id", () => {
    const normalizedOperationId = normalizeOperationId("/pets by id");
    expect(normalizedOperationId).toBe("Pets_by_id");
  });

  it("should return available server link or empty string", async () => {
    const file = await fsPromises.readFile(path.resolve(__dirname, "../schemas/v3/petstore-expanded.json"), "utf8");
    const schema = JSON.parse(file);
    const baseUrl = getBaseUrl(schema);
    const emptyString = getBaseUrl({} as unknown as Document);
    expect(baseUrl).toEqual("https://petstore.swagger.io/v2");
    expect(emptyString).toEqual("");
  });
});
