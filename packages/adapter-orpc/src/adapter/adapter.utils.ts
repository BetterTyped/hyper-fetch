import type { EmptyTypes, QueryParamsType, RequestInstance } from "@hyper-fetch/core";
import { getErrorMessage, parseResponse, stringifyKey, stringifyQueryParams } from "@hyper-fetch/core";
import type { StandardRPCCustomJsonSerializer } from "@orpc/client/standard";
import { StandardRPCJsonSerializer, StandardRPCSerializer } from "@orpc/client/standard";

import { maxGetUrlLength, OrpcMethods, reservedQueryParams } from "./adapter.constants";
import type { OrpcErrorType, OrpcQueryMethod } from "./adapter.types";

/** Serializer of the oRPC RPC protocol, it handles types like `Date`, `BigInt`, `Map`, `Set` and files */
export const createOrpcSerializer = (customJsonSerializers?: StandardRPCCustomJsonSerializer[]) => {
  return new StandardRPCSerializer(new StandardRPCJsonSerializer({ customJsonSerializers }));
};

export type OrpcSerializerType = ReturnType<typeof createOrpcSerializer>;

/** Turns the procedure path `user/byId` or `/user/byId` into the url path `/user/byId` */
export const orpcEndpointMapper = (endpoint: string): string => {
  const segments = endpoint.split("/").filter(Boolean);

  return `/${segments.map(encodeURIComponent).join("/")}`;
};

/**
 * Keys are built from the wire format, so values like `Date` or `Map` stay distinct.
 * Mappers run while the request is created, so an input that can't be serialized can't throw here.
 * It is reported when the request is sent.
 */
const getOrpcInputKey = (input: unknown, serializer: OrpcSerializerType): string => {
  try {
    const serialized = serializer.serialize(input);

    if (!(serialized instanceof FormData)) {
      return JSON.stringify(serialized);
    }

    // Files are compared by their metadata, reading their content would be too expensive
    const parts: string[] = [];
    serialized.forEach((value, key) => {
      parts.push(typeof value === "string" ? value : `${key}:${value.name}:${value.type}:${value.size}`);
    });
    return parts.join("|");
  } catch {
    return "";
  }
};

/** Key of the request response - the same procedure called with a different input is a different resource */
export const getOrpcRequestKey = (request: RequestInstance, serializer: OrpcSerializerType): string => {
  const procedure = orpcEndpointMapper(request.endpoint);
  const input = getOrpcInputKey(request.payload, serializer);

  return `${request.method}_${procedure}-${input}-${stringifyKey(request.queryParams)}`;
};

/** The input is not a part of this key, so `request.abort()` stops every running call of the procedure */
export const getOrpcAbortKey = (request: RequestInstance): string => {
  return `${request.method}_${orpcEndpointMapper(request.endpoint)}-${request.cancelable}`;
};

/**
 * Key of a subscription - listeners of the same topic with the same input share one server subscription.
 * The input is read in the wire format, so values like `Date` or `Map` stay distinct.
 */
export const getOrpcSubscriptionKey = (topic: string, payload: unknown, serializer: OrpcSerializerType): string => {
  return `${topic}-${getOrpcInputKey(payload, serializer)}`;
};

/** Only the user headers, the content type depends on the encoded body and is set while sending */
export const getOrpcHeaders = (request: RequestInstance): HeadersInit => {
  return { ...(request.headers as Record<string, string> | undefined) };
};

type OrpcHttpRequestType = {
  url: string;
  method: "GET" | "POST";
  headers: Record<string, string>;
  body?: string | FormData;
};

/**
 * Encodes a call of the procedure as described by the oRPC RPC protocol, for any base `url` - the client url of a
 * request or the url of a socket. GET sends the input in the `data` query param. Files and urls over the length limit
 * fall back to POST, the same as the `RPCLink` of oRPC.
 */
export const getOrpcCallRequest = ({
  url: base,
  endpoint,
  queryParams,
  headers,
  payload,
  method,
  serializer,
}: {
  url: string;
  endpoint: string;
  queryParams: unknown;
  headers: HeadersInit;
  payload: unknown;
  method: "GET" | "POST";
  serializer: OrpcSerializerType;
}): OrpcHttpRequestType => {
  const [baseUrl, baseQuery] = base.split("?");
  const searchParams = new URLSearchParams(baseQuery);

  // Mappers can return anything, so we normalize their result to the query string
  new URLSearchParams(stringifyQueryParams(queryParams as QueryParamsType | string | EmptyTypes)).forEach(
    (value, key) => {
      if (!reservedQueryParams.includes(key)) {
        searchParams.append(key, value);
      }
    },
  );

  const url = `${baseUrl.replace(/\/+$/, "")}${endpoint}`;
  const serialized = serializer.serialize(payload);
  const userHeaders = { ...(headers as Record<string, string>) };

  if (method === "GET" && !(serialized instanceof FormData)) {
    const getParams = new URLSearchParams(searchParams);
    getParams.append("data", JSON.stringify(serialized));
    const getUrl = `${url}?${getParams.toString()}`;

    if (getUrl.length <= maxGetUrlLength) {
      return { url: getUrl, method: "GET", headers: userHeaders };
    }
  }

  const queryString = searchParams.toString();
  const postUrl = queryString ? `${url}?${queryString}` : url;

  if (serialized instanceof FormData) {
    // The browser sets the multipart content type together with its boundary
    return { url: postUrl, method: "POST", headers: userHeaders, body: serialized };
  }

  return {
    url: postUrl,
    method: "POST",
    headers: { "Content-Type": "application/json", ...userHeaders },
    body: JSON.stringify(serialized),
  };
};

/**
 * Encodes the request as described by the oRPC RPC protocol.
 * Queries use the `queryMethod`, mutations are always sent with POST.
 */
export const getOrpcHttpRequest = ({
  request,
  queryMethod,
  ...call
}: {
  request: RequestInstance;
  endpoint: string;
  queryParams: unknown;
  headers: HeadersInit;
  payload: unknown;
  queryMethod: OrpcQueryMethod;
  serializer: OrpcSerializerType;
}): OrpcHttpRequestType => {
  const method = request.method === OrpcMethods.QUERY && queryMethod === "GET" ? "GET" : "POST";

  return getOrpcCallRequest({ ...call, url: request.client.url, method });
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

/** The same check as `isORPCErrorJson` of oRPC */
const isOrpcError = (value: unknown): value is OrpcErrorType => {
  return (
    isRecord(value) &&
    typeof value.defined === "boolean" &&
    typeof value.code === "string" &&
    typeof value.status === "number" &&
    typeof value.message === "string"
  );
};

type OrpcResultType = { isSuccess: true; data: unknown } | { isSuccess: false; error: unknown };

/**
 * Reads the serialized `{ json, meta }` body, or the multipart body when the output contains files.
 * Statuses from 400 up are errors, the same as in oRPC.
 */
export const getOrpcResult = ({
  body,
  status,
  serializer,
}: {
  body: string | FormData;
  status: number;
  serializer: OrpcSerializerType;
}): OrpcResultType => {
  // An empty body is an undefined output
  let parsed: unknown = body || undefined;
  if (typeof parsed === "string") {
    parsed = parseResponse(parsed);
  }
  const isSerialized = parsed === undefined || parsed instanceof FormData || isRecord(parsed);

  if (!isSerialized) {
    return { isSuccess: false, error: getErrorMessage() };
  }

  const value = serializer.deserialize(parsed);
  if (status < 400) {
    return { isSuccess: true, data: value ?? null };
  }

  if (!isOrpcError(value)) {
    return { isSuccess: false, error: getErrorMessage() };
  }

  // The same fields as `ORPCError.toJSON()`, the data key is there even when the error has no data
  const { defined, code, status: errorStatus, message, data } = value;
  return { isSuccess: false, error: { defined, code, status: errorStatus, message, data } };
};
