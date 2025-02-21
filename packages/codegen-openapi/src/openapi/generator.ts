import DtsGenerator, { ExportedType } from "@anttiviljami/dtsgenerator/dist/core/dtsGenerator";
import RefParser from "@apidevtools/json-schema-ref-parser";
import { parseSchema } from "@anttiviljami/dtsgenerator/dist/core/type";
import { find, chain, isEmpty } from "lodash";
import { promises as fsPromises } from "fs";
import * as process from "process";
import * as _path from "path";
import * as prettier from "prettier";

import { Document, Operation, GeneratedTypes } from "./openapi.types";
import { getAvailableOperations } from "./operations";
import { adjustPathParamsFormat, normalizeOperationId, createTypeBaseName, getBaseUrl } from "./utils";
import { HttpMethod } from "./http-methods.enum";

export class OpenapiRequestGenerator {
  protected openapiDocument: Document;
  constructor(openapiDocument: any) {
    this.openapiDocument = openapiDocument as Document;
  }

  async generateFile({ fileName, url }: { fileName?: string; url?: string }) {
    const defaultFileName = "openapi.client";
    const baseUrl = url || getBaseUrl(this.openapiDocument);
    const { schemaTypes, generatedTypes, generatedRequests } = await this.generateRequestsFromSchema();
    const contents = [
      `import { createClient } from "@hyper-fetch/core";`,
      "\n\n",
      schemaTypes,
      "\n\n",
      `export const client = createClient({url: "${baseUrl}"})`,
      "\n\n",
      generatedTypes.join("\n\n"),
      "\n\n",
      generatedRequests.join("\n\n"),
    ].join("");
    const prettierOpts = {
      printWidth: 120,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
      trailingComma: "all" as const,
      bracketSpacing: true,
      bracketSameLine: false,
      proseWrap: "always" as const,
      arrowParens: "always" as const,
      parser: "typescript" as const,
    };

    const fName = fileName || defaultFileName;
    const generatedPath = _path.join(process.cwd(), `${fName}${fName.endsWith(".ts") ? "" : ".ts"}`);

    await fsPromises.writeFile(generatedPath, `${prettier.format(contents, prettierOpts)}`);

    return generatedPath;
  }

  generateRequestsFromSchema = async () => {
    const { schemaTypes, exportedTypes } = await OpenapiRequestGenerator.prepareSchema(this.openapiDocument);

    const generatedTypes: string[] = [];
    const generatedRequests: string[] = [];
    const metadata: ReturnType<(typeof OpenapiRequestGenerator)["generateMethodMetadata"]>[] = [];

    getAvailableOperations(this.openapiDocument).forEach((operation) => {
      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);
      const operationTypes = OpenapiRequestGenerator.generateTypes(meta);
      const generatedRequest = OpenapiRequestGenerator.generateHyperFetchRequest(meta, operationTypes);

      metadata.push(meta);
      generatedTypes.push(Object.values(operationTypes).join("\n"));
      generatedRequests.push(generatedRequest);
    });

    return { metadata, schemaTypes, generatedTypes, generatedRequests };
  };
  static generateHyperFetchRequest(
    { id, path, method }: { id: string; path: string; method: string },
    types: Record<string, string>,
  ) {
    const Response = types[`${createTypeBaseName(id)}ResponseType`]
      ? `${createTypeBaseName(id)}ResponseType`
      : undefined;
    const Payload = types[`${createTypeBaseName(id)}RequestBody`] ? `${createTypeBaseName(id)}RequestBody` : undefined;
    const LocalError = types[`${createTypeBaseName(id)}ErrorType`] ? `${createTypeBaseName(id)}ErrorType` : undefined;
    const QueryParams = types[`${createTypeBaseName(id)}QueryParams`]
      ? `${createTypeBaseName(id)}QueryParams`
      : undefined;
    const getVariableName = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);

    let genericType = "";

    const addToGenericType = (key: string, value: string) => {
      if (genericType) {
        genericType += ",";
      }
      genericType += `${key}:${value}`;
    };

    if (Response) {
      addToGenericType("response", Response);
    }
    if (Payload) {
      addToGenericType("payload", Payload);
    }
    if (LocalError) {
      addToGenericType("error", LocalError);
    }
    if (QueryParams) {
      addToGenericType("query", QueryParams);
    }

    if (genericType) {
      genericType = `<{${genericType}}>`;
    }

    return `export const ${getVariableName(
      createTypeBaseName(id),
    )} = client.createRequest${genericType}()({method: "${method}", endpoint: "${path}"})`;
  }

  static generateTypes({
    id,
    pathParametersType,
    queryParametersType,
    requestBodyType,
    errorType,
    responseType,
  }: {
    id: string;
    pathParametersType: string | undefined;
    queryParametersType: string | undefined;
    requestBodyType: string | undefined;
    errorType: string;
    responseType: string;
  }) {
    const typeName = createTypeBaseName(id);
    const types: GeneratedTypes<typeof typeName> = {};
    if (pathParametersType) {
      types[`${typeName}PathParams`] = `export type ${typeName}PathParams = ${pathParametersType}`;
    }
    if (queryParametersType) {
      types[`${typeName}QueryParams`] = `export type ${typeName}QueryParams = ${queryParametersType}`;
    }
    if (requestBodyType) {
      types[`${typeName}RequestBody`] = `export type ${typeName}RequestBody = ${requestBodyType}`;
    }
    if (errorType) {
      types[`${typeName}ErrorType`] = `export type ${typeName}ErrorType = ${errorType}`;
    }
    if (responseType) {
      types[`${typeName}ResponseType`] = `export type ${typeName}ResponseType = ${responseType}`;
    }
    return types;
  }

  static generateMethodMetadata(
    operation: { operationId: string; path: string; method: string } & Partial<Operation>,
    exportTypes: ExportedType[],
  ) {
    const { operationId, method, path: relPath } = operation;
    const normalizedOperationId = normalizeOperationId(operationId);
    const pathParametersType = find(exportTypes, {
      schemaRef: `#/paths/${normalizedOperationId}/pathParameters`,
    })?.path;
    const queryParametersType = find(exportTypes, {
      schemaRef: `#/paths/${normalizedOperationId}/queryParameters`,
    })?.path;
    const requestBodyType = find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/requestBody` })?.path;
    const responseTypePaths = chain(exportTypes)
      .filter(({ schemaRef }) => schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses/2`))
      .map(({ path }) => path)
      .value();
    const errorTypePaths = chain(exportTypes)
      .filter(
        ({ schemaRef }) =>
          schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses/4`) ||
          schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses/5`),
      )
      .map(({ path }) => path)
      .value();

    const responseType = !isEmpty(responseTypePaths) ? responseTypePaths.join(" | ") : "any";
    const errorType = !isEmpty(errorTypePaths) ? errorTypePaths.join(" | ") : "undefined";

    return {
      id: normalizedOperationId,
      pathParametersType,
      queryParametersType,
      requestBodyType,
      errorType,
      responseType,
      path: adjustPathParamsFormat(relPath),
      method: method ? method.toUpperCase() : HttpMethod.GET,
    };
  }

  static async prepareSchema(openapiDocument: Document) {
    const rootSchema = await RefParser.bundle(openapiDocument);
    const schema = parseSchema(rootSchema as any);
    const generator = new DtsGenerator([schema]);
    const schemaTypes = await generator.generate();
    const exportedTypes = generator.getExports();

    return { schemaTypes, exportedTypes };
  }
}
