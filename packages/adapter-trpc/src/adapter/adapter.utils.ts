import type { EmptyTypes, QueryParamsType, RequestInstance } from "@hyper-fetch/core";
import { getErrorMessage, stringifyKey, stringifyQueryParams } from "@hyper-fetch/core";

import { reservedQueryParams, TrpcMethods } from "./adapter.constants";
import type { TrpcTransformerType } from "./adapter.types";

/** Turns the SDK path `/user/byId` into the procedure path `user.byId` */
export const trpcEndpointMapper = (endpoint: string): string => {
  return endpoint.replaceAll(/^\/+|\/+$/g, "").replaceAll("/", ".");
};

/** The input after the transformer, before it is encoded to JSON. `undefined` means that there is no input to send */
export const serializeTrpcInput = (input: unknown, transformer?: TrpcTransformerType): unknown => {
  return transformer ? transformer.serialize(input) : input;
};

/** The input as it is sent over the wire, `undefined` means that there is no input to send */
export const getTrpcInput = (input: unknown, transformer?: TrpcTransformerType): string | undefined => {
  const serialized = serializeTrpcInput(input, transformer);

  return serialized === undefined ? undefined : JSON.stringify(serialized);
};

/**
 * Keys are built from the wire format, so values like `Date` or `Map` handled by the transformer stay distinct.
 * Mappers run while the request is created, so a value that can't be serialized can't throw here.
 * It is reported when the request is sent.
 */
const getTrpcInputKey = (input: unknown, transformer?: TrpcTransformerType): string => {
  try {
    return getTrpcInput(input, transformer) ?? "";
  } catch {
    return "";
  }
};

/** Key of the request response - the same procedure called with a different input is a different resource */
export const getTrpcRequestKey = (request: RequestInstance, transformer?: TrpcTransformerType): string => {
  const procedure = trpcEndpointMapper(request.endpoint);
  const input = getTrpcInputKey(request.payload, transformer);

  return `${request.method}_${procedure}-${input}-${stringifyKey(request.queryParams)}`;
};

/** The input is not a part of this key, so `request.abort()` stops every running call of the procedure */
export const getTrpcAbortKey = (request: RequestInstance): string => {
  return `${request.method}_${trpcEndpointMapper(request.endpoint)}-${request.cancelable}`;
};

export const getTrpcHeaders = (request: RequestInstance): HeadersInit => {
  // Servers reject POST requests without the content type, queries skip it to avoid the CORS preflight
  const contentType: Record<string, string> =
    request.method === TrpcMethods.MUTATION ? { "Content-Type": "application/json" } : {};

  return { ...contentType, ...(request.headers as Record<string, string> | undefined) };
};

export const getTrpcUrl = (request: RequestInstance, queryParams: unknown, input: string | undefined): string => {
  const isQuery = request.method !== TrpcMethods.MUTATION;

  return getTrpcProcedureUrl({
    url: request.client.url,
    endpoint: request.endpoint,
    queryParams,
    input: isQuery ? input : undefined,
  });
};

/**
 * Url of a procedure: `{url}/user.byId?{queryParams}&input={input}`.
 * Query params of the base url are kept, the reserved ones (`input`, `batch`) set by the user are dropped.
 */
export const getTrpcProcedureUrl = ({
  url,
  endpoint,
  queryParams,
  input,
  protocolParams = {},
}: {
  url: string;
  endpoint: string;
  queryParams: unknown;
  /** Encoded input sent in the query string, `undefined` sends no input */
  input: string | undefined;
  /** Query params of the tRPC protocol added after the input, e.g. `lastEventId` of a subscription */
  protocolParams?: Record<string, string>;
}): string => {
  const [baseUrl, baseQuery] = url.split("?");
  const searchParams = new URLSearchParams(baseQuery);

  // Mappers can return anything, so we normalize their result to the query string
  new URLSearchParams(stringifyQueryParams(queryParams as QueryParamsType | string | EmptyTypes)).forEach(
    (value, key) => {
      if (!reservedQueryParams.includes(key)) {
        searchParams.append(key, value);
      }
    },
  );

  const encodedInput = input !== undefined ? `input=${encodeURIComponent(input)}` : "";
  const encodedProtocolParams = Object.entries(protocolParams).map(
    ([key, value]) => `${key}=${encodeURIComponent(value)}`,
  );
  const queryString = [searchParams.toString(), encodedInput, ...encodedProtocolParams].filter(Boolean).join("&");
  const procedure = trpcEndpointMapper(endpoint);

  return `${baseUrl.replace(/\/+$/, "")}/${procedure}${queryString ? `?${queryString}` : ""}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

type TrpcResultType = { isSuccess: true; data: unknown } | { isSuccess: false; error: unknown };

/** Reads the `{ result: { data } }` and `{ error }` envelopes, anything else did not come from a tRPC procedure */
export const getTrpcResult = (parsed: unknown, status: number, transformer?: TrpcTransformerType): TrpcResultType => {
  const deserialize = (value: unknown) => (transformer ? transformer.deserialize(value) : value);

  if (isRecord(parsed) && parsed.error !== undefined) {
    return { isSuccess: false, error: deserialize(parsed.error) };
  }

  if (isRecord(parsed) && isRecord(parsed.result) && status < 400) {
    const { data } = parsed.result;

    // Procedures returning nothing have no `data` key when there is no transformer
    return { isSuccess: true, data: data === undefined ? null : (deserialize(data) ?? null) };
  }

  return { isSuccess: false, error: getErrorMessage() };
};
