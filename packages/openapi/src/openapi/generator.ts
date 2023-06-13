import DtsGenerator, { ExportedType } from "@anttiviljami/dtsgenerator/dist/core/dtsGenerator";
import RefParser from "@apidevtools/json-schema-ref-parser";
import { parseSchema } from "@anttiviljami/dtsgenerator/dist/core/type";
import * as _ from "lodash";

import { Document, Operation, GeneratedTypes } from "./openapi.types";
import { getAvailableOperations } from "./operations";
import { adjustPathParamsFormat, normalizeOperationId, createTypeBaseName } from "./utils";

export function generateHyperFetchRequest(
  { id, path, method }: { id: string; path: string; method: string },
  types: Record<string, string>,
) {
  const Response = types[`${createTypeBaseName(id)}ResponseType`] ? `${createTypeBaseName(id)}ResponseType` : "unknown";
  const Payload = types[`${createTypeBaseName(id)}RequestBody`] ? `${createTypeBaseName(id)}RequestBody` : "undefined";
  const LocalError = "undefined";
  const QueryParams = types[`${createTypeBaseName(id)}QueryParams`]
    ? `${createTypeBaseName(id)}QueryParams`
    : "undefined";
  return `export const ${id} = client.createRequest<${Response}, ${Payload}, ${LocalError}, ${QueryParams}>()({method: "${method}", endpoint: "${path}"})`;
}

function generateTypes({
  id,
  pathParametersType,
  queryParametersType,
  requestBodyType,
  responseType,
}: {
  id: string;
  pathParametersType: string | undefined;
  queryParametersType: string | undefined;
  requestBodyType: string | undefined;
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
  if (responseType) {
    types[`${typeName}ResponseType`] = `export type ${typeName}ResponseType = ${responseType}`;
  }

  return types;
}

export const generateRequestsFromSchema = async (openapiDocument: Document) => {
  const rootSchema = await RefParser.bundle(openapiDocument);
  const schema = parseSchema(rootSchema as any);
  const generator = new DtsGenerator([schema]);
  const schemaTypes = await generator.generate();
  const exportedTypes = generator.getExports();

  const availableOperations = getAvailableOperations(openapiDocument);

  const generatedTypes = [];
  const generatedRequests = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const operation of availableOperations) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const metadata = generateMethodMetadata(operation, exportedTypes);
    const operationTypes = generateTypes(metadata);
    const generatedRequest = generateHyperFetchRequest(metadata, operationTypes);

    generatedTypes.push(Object.values(operationTypes).join("\n"));
    generatedRequests.push(generatedRequest);
  }

  console.log(schemaTypes);
  console.log(generatedTypes.join("\n\n"));
  console.log(generatedRequests.join("\n\n"));
};

function generateMethodMetadata(operation: Partial<Operation>, exportTypes: ExportedType[]) {
  const { operationId, method, path: relPath } = operation;
  const normalizedOperationId = normalizeOperationId(operationId);
  const pathParametersType = _.find(exportTypes, {
    schemaRef: `#/paths/${normalizedOperationId}/pathParameters`,
  })?.path;
  const queryParametersType = _.find(exportTypes, {
    schemaRef: `#/paths/${normalizedOperationId}/queryParameters`,
  })?.path;
  const requestBodyType = _.find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/requestBody` })?.path;
  const responseTypePaths = _.chain(exportTypes)
    .filter(({ schemaRef }) => schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses/2`))
    .map(({ path }) => path)
    .value();
  const responseType = !_.isEmpty(responseTypePaths) ? responseTypePaths.join(" | ") : "any";

  return {
    id: normalizedOperationId,
    pathParametersType,
    queryParametersType,
    requestBodyType,
    responseType,
    path: adjustPathParamsFormat(relPath),
    method: method.toUpperCase(),
  };
}
