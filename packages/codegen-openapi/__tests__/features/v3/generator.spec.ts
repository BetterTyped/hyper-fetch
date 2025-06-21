/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * @jest-environment node
 */

import { promises as fsPromises } from "fs";
import * as path from "path";

import { OpenapiRequestGenerator, Document, getAvailableOperations, Operation } from "../../../src";
import { HttpMethod } from "openapi/http-methods.enum";

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
    path: "/pet",
    method: "POST",
  },
  find_pet_by_id: {
    id: "find_pet_by_id",
    pathParametersType: "Paths.FindPetById.PathParameters",
    queryParametersType: undefined,
    requestBodyType: undefined,
    responseType: "Paths.FindPetById.Responses.$200",
    path: "/pet/:id",
    method: "GET",
  },
  deletePet: {
    id: "deletePet",
    pathParametersType: "Paths.DeletePet.PathParameters",
    queryParametersType: undefined,
    requestBodyType: undefined,
    responseType: "any",
    path: "/pet/:petId",
    method: "DELETE",
  },
  updatePet: {
    id: "updatePet",
    pathParametersType: undefined,
    queryParametersType: undefined,
    requestBodyType: "Paths.UpdatePet.RequestBody",
    responseType: "Paths.UpdatePet.Responses.$200",
    path: "/pet",
    method: "PUT",
  },
};
const expectedOperationTypes = {
  FindPetsQueryParams: "export type FindPetsQueryParams = Paths.FindPets.QueryParameters",
  FindPetsResponseType: "export type FindPetsResponseType = Paths.FindPets.Responses.$200",
  AddPetRequestBody: "export type AddPetRequestBody = Paths.AddPet.RequestBody",
  AddPetResponseType: "export type AddPetResponseType = Paths.AddPet.Responses.$200",
  AddPetErrorType: "export type AddPetErrorType = Paths.AddPet.Responses.$405",
  FindPetByIdPathParams: "export type FindPetByIdPathParams = Paths.FindPetById.PathParameters",
  FindPetByIdResponseType: "export type FindPetByIdResponseType = Paths.FindPetById.Responses.$200",
  DeletePetPathParams: "export type DeletePetPathParams = Paths.DeletePet.PathParameters",
  DeletePetResponseType: "export type DeletePetResponseType = any",
  DeletePetErrorType: "export type DeletePetErrorType = Paths.DeletePet.Responses.$400",
  UpdatePetRequestBody: "export type UpdatePetRequestBody = Paths.UpdatePet.RequestBody",
  UpdatePetResponseType: "export type UpdatePetResponseType = Paths.UpdatePet.Responses.$200",
  UpdatePetErrorType:
    "export type UpdatePetErrorType = Paths.UpdatePet.Responses.$400 | Paths.UpdatePet.Responses.$404 | Paths.UpdatePet.Responses.$405",
};
const expectedRequests = [
  `export const findPets = client.createRequest<{response:FindPetsResponseType,queryParams?:FindPetsQueryParams}>()({method: "GET", endpoint: "/pets"})`,
  `export const addPet = client.createRequest<{response:AddPetResponseType,payload:AddPetRequestBody,error:AddPetErrorType}>()({method: "POST", endpoint: "/pet"})`,
  `export const deletePet = client.createRequest<{response:DeletePetResponseType,error:DeletePetErrorType}>()({method: "DELETE", endpoint: "/pet/:petId"})`,
  `export const updatePet = client.createRequest<{response:UpdatePetResponseType,payload:UpdatePetRequestBody,error:UpdatePetErrorType}>()({method: "PUT", endpoint: "/pet"})`,
];

describe("Generator", () => {
  let schema: string;

  beforeAll(async () => {
    const file = await fsPromises.readFile(path.resolve(__dirname, "../../schemas/v3/petstore-expanded.json"), "utf8");
    schema = JSON.parse(file);
  });

  it("should generate hyper fetch requests", async () => {
    const { exportedTypes } = await OpenapiRequestGenerator.prepareSchema(schema as unknown as Document);
    getAvailableOperations(schema as unknown as Document).forEach((operation) => {
      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);
      const operationTypes = OpenapiRequestGenerator.generateTypes(meta);
      const generatedRequest = OpenapiRequestGenerator.generateHyperFetchRequest(meta, operationTypes);

      if (expectedMetadata[meta.id as keyof typeof expectedMetadata]) {
        expect(meta).toMatchObject(expectedMetadata[meta.id as keyof typeof expectedMetadata]);

        Object.entries(operationTypes).forEach(([name, value]) => {
          expect(value).toStrictEqual(expectedOperationTypes[name as keyof typeof expectedOperationTypes]);
        });
        expect(expectedRequests).toContain(generatedRequest);
      }
    });
  });

  it("Should generate file with default name", async () => {
    const generator = new OpenapiRequestGenerator(schema);
    const generatedFileNamePath = await generator.generateFile({});
    expect(generatedFileNamePath).toEndWith("openapi.client.ts");
    await fsPromises.rm(generatedFileNamePath);
  });

  it("Should generate file with provided name", async () => {
    const generator = new OpenapiRequestGenerator(schema);
    const generatedFileNamePath = await generator.generateFile({ fileName: "schemaApiRequests" });
    expect(generatedFileNamePath).toEndWith("schemaApiRequests.ts");
    await fsPromises.rm(generatedFileNamePath);
  });

  it("Should generate file with provided name without duplication for .ts ending if provided", async () => {
    const generator = new OpenapiRequestGenerator(schema);
    const generatedFileNamePath = await generator.generateFile({ fileName: "schemaApiRequests.ts" });
    expect(generatedFileNamePath).toEndWith("schemaApiRequests.ts");
    await fsPromises.rm(generatedFileNamePath);
  });

  // it("Should generate file with provided baseUrl", async () => {
  //   const baseUrl = "http://baseurl.com";
  //   const generator = new OpenapiRequestGenerator(schema);
  //   const generatedFileNamePath = await generator.generateFile({ url: "http://baseurl.com" });
  //   const imported = await import(generatedFileNamePath);
  //   expect(imported.client.url).toEqual(baseUrl);
  //   await fsPromises.rm(generatedFileNamePath);
  // });

  describe("HTTP Method handling", () => {
    it("should use provided HTTP method in uppercase", async () => {
      const { exportedTypes } = await OpenapiRequestGenerator.prepareSchema(schema as unknown as Document);
      const operations = getAvailableOperations(schema as unknown as Document);

      // Find the POST operation (addPet)
      const postOperation = operations.find((op) => op.method === "post");
      const meta = OpenapiRequestGenerator.generateMethodMetadata(postOperation!, exportedTypes);

      expect(meta.method).toBe("POST");
    });

    it("should default to GET when no method is provided", async () => {
      const { exportedTypes } = await OpenapiRequestGenerator.prepareSchema(schema as unknown as Document);
      const operation = {
        // Minimal operation object without method
        operationId: "testOperation",
        path: "/test",
        method: undefined as any,
      };

      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);

      expect(meta.method).toBe("get");
    });
  });

  describe("Error type handling", () => {
    let exportedTypes: any;

    beforeEach(async () => {
      exportedTypes = (await OpenapiRequestGenerator.prepareSchema(schema as unknown as Document)).exportedTypes;
    });

    it("should generate both error and response types when both are present", async () => {
      const operation: { operationId: string; path: string; method: string } & Partial<Operation> = {
        operationId: "testOperation",
        path: "/test",
        method: HttpMethod.GET,

        responses: {
          "200": { content: { "application/json": { schema: { type: "object" } } }, description: "" },
          "400": { content: { "application/json": { schema: { type: "object" } } }, description: "" },
        },
      };

      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);
      meta.errorType = "ErrorType";
      meta.responseType = "ResponseType";

      const types = OpenapiRequestGenerator.generateTypes(meta);

      // Verify exact type strings are generated
      expect(types.TestOperationErrorType).toBe("export type TestOperationErrorType = ErrorType");
      expect(types.TestOperationResponseType).toBe("export type TestOperationResponseType = ResponseType");
    });

    it("should generate only response type when error type is null", async () => {
      const operation: { operationId: string; path: string; method: string } & Partial<Operation> = {
        operationId: "testOperation",
        path: "/test",
        method: HttpMethod.GET,
        responses: {
          "200": { content: { "application/json": { schema: { type: "object" } } }, description: "" },
        },
      };

      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);
      // @ts-ignore
      meta.errorType = null;
      meta.responseType = "ResponseType";

      const types = OpenapiRequestGenerator.generateTypes(meta);

      // Verify only response type is generated
      expect(types.TestOperationErrorType).toBeUndefined();
      expect(types.TestOperationResponseType).toBe("export type TestOperationResponseType = ResponseType");
    });

    it("should generate only error type when response type is null", async () => {
      const operation: { operationId: string; path: string; method: string } & Partial<Operation> = {
        operationId: "testOperation",
        path: "/test",
        method: HttpMethod.GET,
        responses: {
          "400": { content: { "application/json": { schema: { type: "object" } } }, description: "" },
        },
      };

      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);
      meta.errorType = "ErrorType";
      // @ts-ignore
      meta.responseType = null;

      const types = OpenapiRequestGenerator.generateTypes(meta);

      // Verify only error type is generated
      expect(types.TestOperationErrorType).toBe("export type TestOperationErrorType = ErrorType");
      expect(types.TestOperationResponseType).toBeUndefined();
    });

    it("should not generate any types when both are null", async () => {
      const operation: { operationId: string; path: string; method: string } & Partial<Operation> = {
        operationId: "testOperation",
        path: "/test",
        method: HttpMethod.GET,
      };

      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);
      // @ts-ignore
      meta.errorType = null;
      // @ts-ignore
      meta.responseType = null;

      const types = OpenapiRequestGenerator.generateTypes(meta);

      // Verify no types are generated
      expect(types.TestOperationErrorType).toBeUndefined();
      expect(types.TestOperationResponseType).toBeUndefined();
    });
  });

  describe("Generic type handling", () => {
    let exportedTypes: any;

    beforeEach(async () => {
      exportedTypes = (await OpenapiRequestGenerator.prepareSchema(schema as unknown as Document)).exportedTypes;
    });

    it("should include generic type when present", async () => {
      const operation: { operationId: string; path: string; method: string } & Partial<Operation> = {
        operationId: "testOperation",
        path: "/test",
        method: HttpMethod.GET,
        responses: {
          "200": { content: { "application/json": { schema: { type: "object" } } }, description: "" },
        },
      };

      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);

      const request = OpenapiRequestGenerator.generateHyperFetchRequest(meta, {
        TestOperationResponseType: "string",
      });
      expect(request).toBe(
        'export const testOperation = client.createRequest<{response:TestOperationResponseType}>()({method: "GET", endpoint: "/test"})',
      );
    });

    it("should generate basic request when genericType is falsy", async () => {
      const operation: { operationId: string; path: string; method: string } & Partial<Operation> = {
        operationId: "testOperation",
        path: "/test",
        method: HttpMethod.GET,
        responses: {
          "200": { content: { "application/json": { schema: { type: "object" } } }, description: "" },
        },
      };

      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);

      const request = OpenapiRequestGenerator.generateHyperFetchRequest(meta, {});
      expect(request).toBe('export const testOperation = client.createRequest()({method: "GET", endpoint: "/test"})');
    });
  });
});
