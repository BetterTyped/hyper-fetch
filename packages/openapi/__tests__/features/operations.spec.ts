/**
 * @jest-environment node
 */

import { promises as fsPromises } from "fs";
import * as path from "path";

import { Document } from "../../src";
import { getAvailableOperations } from "../../src/openapi/operations";

describe("Operations", () => {
  let schema: string;
  beforeAll(async () => {
    const file = await fsPromises.readFile(path.resolve(__dirname, "../schemas/v3/petstore-expanded.json"), "utf8");
    schema = JSON.parse(file);
  });

  it("should get available operations for openapi schema", async () => {
    const operationIdMap = {
      findPets: {
        _shouldExist: ["responses", "parameters"],
        path: "/pets",
        method: "get",
      },
      addPet: {
        _shouldExist: ["responses", "requestBody"],
        path: "/pets",
        method: "post",
      },
      "find pet by id": {
        _shouldExist: ["parameters", "responses"],
        responses: [],
        path: "/pets/{id}",
        method: "get",
      },
      deletePet: {
        _shouldExist: ["parameters", "responses"],
        path: "/pets/{id}",
        method: "delete",
      },
    };
    const operations = getAvailableOperations(schema as unknown as Document);
    // eslint-disable-next-line no-restricted-syntax
    for (const operation of operations) {
      const requirements = operationIdMap[operation.operationId];
      expect(requirements.path).toEqual(operation.path);
      expect(requirements.method).toEqual(operation.method);
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      requirements._shouldExist?.forEach((req) => {
        expect(operation).toHaveProperty(req);
      });
    }
  });
  it("should return empty object if no correct json was passed", () => {
    const operations = getAvailableOperations({} as unknown as Document);
    expect(operations).toStrictEqual([]);
  });
});
