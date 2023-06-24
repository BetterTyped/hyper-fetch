/**
 * @jest-environment node
 */

import { promises as fsPromises } from "fs";
import * as path from "path";

import { OpenapiRequestGenerator, Document } from "../../src";
import { getAvailableOperations } from "../../src/openapi/operations";

const expectedMetadata = {
  findPets: {
    id: "findPets",
    pathParametersType: undefined,
    queryParametersType: "Paths.FindPets.QueryParameters",
    requestBodyType: undefined,
    responseType: "Paths.FindPets.Responses.$200",
    path: "/pets",
    method: "GET",
  },
  addPet: {
    id: "addPet",
    pathParametersType: undefined,
    queryParametersType: undefined,
    requestBodyType: "Paths.AddPet.RequestBody",
    responseType: "Paths.AddPet.Responses.$200",
    path: "/pets",
    method: "POST",
  },
  find_pet_by_id: {
    id: "find_pet_by_id",
    pathParametersType: "Paths.FindPetById.PathParameters",
    queryParametersType: undefined,
    requestBodyType: undefined,
    responseType: "Paths.FindPetById.Responses.$200",
    path: "/pets/:id",
    method: "GET",
  },
  deletePet: {
    id: "deletePet",
    pathParametersType: "Paths.DeletePet.PathParameters",
    queryParametersType: undefined,
    requestBodyType: undefined,
    responseType: "Paths.DeletePet.Responses.$204",
    path: "/pets/:id",
    method: "DELETE",
  },
};
const expectedOperationTypes = {
  FindPetsQueryParams: "export type FindPetsQueryParams = Paths.FindPets.QueryParameters",
  FindPetsResponseType: "export type FindPetsResponseType = Paths.FindPets.Responses.$200",
  AddPetRequestBody: "export type AddPetRequestBody = Paths.AddPet.RequestBody",
  AddPetResponseType: "export type AddPetResponseType = Paths.AddPet.Responses.$200",
  FindPetByIdPathParams: "export type FindPetByIdPathParams = Paths.FindPetById.PathParameters",
  FindPetByIdResponseType: "export type FindPetByIdResponseType = Paths.FindPetById.Responses.$200",
  DeletePetPathParams: "export type DeletePetPathParams = Paths.DeletePet.PathParameters",
  DeletePetResponseType: "export type DeletePetResponseType = Paths.DeletePet.Responses.$204",
};
const expectedRequests = [
  `export const findPets = client.createRequest<FindPetsResponseType, undefined, undefined, FindPetsQueryParams>()({method: "GET", endpoint: "/pets"})`,
  `export const addPet = client.createRequest<AddPetResponseType, AddPetRequestBody, undefined, undefined>()({method: "POST", endpoint: "/pets"})`,
  `export const findPetById = client.createRequest<FindPetByIdResponseType, undefined, undefined, undefined>()({method: "GET", endpoint: "/pets/:id"})`,
  `export const deletePet = client.createRequest<DeletePetResponseType, undefined, undefined, undefined>()({method: "DELETE", endpoint: "/pets/:id"})`,
];
describe("Generator", () => {
  let schema: string;

  beforeAll(async () => {
    const file = await fsPromises.readFile(path.resolve(__dirname, "../schemas/v3/petstore-expanded.json"), "utf8");
    schema = JSON.parse(file);
  });

  it("should generate hyper fetch requests", async () => {
    const operations = getAvailableOperations(schema as unknown as Document);
    const { exportedTypes } = await OpenapiRequestGenerator.prepareSchema(schema as unknown as Document);
    // eslint-disable-next-line no-restricted-syntax
    for (const operation of operations) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);
      const operationTypes = OpenapiRequestGenerator.generateTypes(meta);
      const generatedRequest = OpenapiRequestGenerator.generateHyperFetchRequest(meta, operationTypes);

      expect(meta).toMatchObject(expectedMetadata[meta.id]);
      // eslint-disable-next-line no-restricted-syntax
      for (const [name, value] of Object.entries(operationTypes)) {
        expect(value).toStrictEqual(expectedOperationTypes[name]);
      }

      expect(expectedRequests).toContain(generatedRequest);
    }
  });

  it("Should generate file with default name", async () => {
    const generator = new OpenapiRequestGenerator(schema);
    const generatedFileNamePath = await generator.generateFile();
    expect(generatedFileNamePath).toEndWith("openapi.client.ts");
    await fsPromises.rm(generatedFileNamePath);
  });

  it("Should generate file with provided name", async () => {
    const generator = new OpenapiRequestGenerator(schema);
    const generatedFileNamePath = await generator.generateFile("schemaApiRequests");
    expect(generatedFileNamePath).toEndWith("schemaApiRequests.ts");
    await fsPromises.rm(generatedFileNamePath);
  });

  it("Should generate file with provided name without duplication for .ts ending if provided", async () => {
    const generator = new OpenapiRequestGenerator(schema);
    const generatedFileNamePath = await generator.generateFile("schemaApiRequests.ts");
    expect(generatedFileNamePath).toEndWith("schemaApiRequests.ts");
    await fsPromises.rm(generatedFileNamePath);
  });
});
