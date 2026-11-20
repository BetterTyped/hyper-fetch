import type { ClientInstance, NonNullableKeys } from "@hyper-fetch/core";
import { createClient } from "@hyper-fetch/core";

import type { DevtoolsRequestEvent } from "@/context/applications/types";

let id = 0;

export type ResponseEventOptions = {
  client?: ClientInstance;
  endpoint?: string;
  params?: Record<string, string | number>;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cache?: boolean;
  payload?: unknown;
  success?: boolean;
  status?: number;
  data?: unknown;
  error?: unknown;
  /** ms between being added to the queue and being triggered */
  queueTime?: number;
  /** ms between being triggered and the adapter starting the request */
  processingTime?: number;
  /** ms between the adapter starting the request and the response */
  responseTime?: number;
  /** When the request was added to the queue */
  startedAt?: number;
};

/**
 * A finished request event with exact timings, as the renderer receives it from the plugin:
 * the request travels as JSON.
 */
export const createResponseEvent = ({
  client = createClient({ url: "http://localhost:5000" }),
  endpoint = "/users",
  params,
  method = "GET",
  cache = true,
  payload,
  success = true,
  status = success ? 200 : 400,
  data = success ? { ok: true } : null,
  error = success ? null : { message: "Failed" },
  queueTime = 0,
  processingTime = 0,
  responseTime = 100,
  startedAt = 1000,
}: ResponseEventOptions = {}): NonNullableKeys<DevtoolsRequestEvent> => {
  id += 1;
  const requestId = `request-${id}`;
  const request = client
    .createRequest<{ response: unknown; payload: unknown }>()({ endpoint, method, cache })
    .clone({ params: params as never, payload });

  const addedTimestamp = startedAt;
  const triggerTimestamp = addedTimestamp + queueTime;
  const requestTimestamp = triggerTimestamp + processingTime;
  const responseTimestamp = requestTimestamp + responseTime;

  return {
    requestId,
    // A JSON round trip, exactly what the websocket does to it
    // oxlint-disable-next-line unicorn/prefer-structured-clone
    request: JSON.parse(JSON.stringify(request.toJSON())),
    client,
    response: {
      data,
      error,
      status,
      success,
      extra: { headers: {} },
      requestTimestamp,
      responseTimestamp,
    },
    details: {
      retries: 0,
      isCanceled: false,
      isOffline: false,
      willRetry: false,
      addedTimestamp,
      triggerTimestamp,
      requestTimestamp,
      responseTimestamp,
    },
    isRemoved: false,
    isCanceled: false,
    isSuccess: success,
    isFinished: true,
    isPaused: false,
    timestamp: responseTimestamp,
  };
};
