import type { DefaultMapperType, QueryParamsType } from "@hyper-fetch/core";
import { Adapter, defaultMapper, parseResponse, stringifyQueryParams } from "@hyper-fetch/core";

import { defaultTimeout, TrpcMethods, trpcExtra } from "./adapter.constants";
import type {
  FetchTrpcAdapterOptionsType,
  TrpcAdapterOptionsType,
  TrpcAdapterType,
  TrpcExtraType,
  TrpcMethod,
} from "./adapter.types";
import {
  getTrpcAbortKey,
  getTrpcHeaders,
  getTrpcInput,
  getTrpcRequestKey,
  getTrpcResult,
  getTrpcUrl,
  trpcEndpointMapper,
} from "./adapter.utils";

const readBody = async (response: Response, onProgress: (progress: ProgressEvent) => void) => {
  if (!response.body || typeof response.body.getReader !== "function") {
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
  let loaded = 0;
  let body = "";

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    loaded += value.length;
    body += decoder.decode(value, { stream: true });
    onProgress({ total: contentLength || loaded, loaded } as ProgressEvent);
  }

  return body + decoder.decode();
};

export const getTrpcAdapter = ({ transformer }: TrpcAdapterOptionsType = {}): TrpcAdapterType =>
  new Adapter<
    FetchTrpcAdapterOptionsType,
    TrpcMethod,
    number,
    TrpcExtraType,
    QueryParamsType | string,
    QueryParamsType | string | undefined,
    string,
    DefaultMapperType,
    DefaultMapperType,
    DefaultMapperType,
    DefaultMapperType
  >({
    name: "trpc",
    defaultMethod: TrpcMethods.QUERY,
    defaultExtra: trpcExtra,
    systemErrorStatus: 0,
    systemErrorExtra: trpcExtra,
  })
    .onInitialize(({ client }) => {
      client.setCacheKeyMapper((request) => getTrpcRequestKey(request, transformer));
      client.setQueryKeyMapper((request) => getTrpcRequestKey(request, transformer));
      client.setAbortKeyMapper((request) => getTrpcAbortKey(request));
    })
    // Queries are safe reads, the same as GET in the HttpAdapter
    .setRequestDefaults((options) => {
      const method = options.method ?? TrpcMethods.QUERY;
      return method === TrpcMethods.QUERY ? { deduplicate: true } : {};
    })
    .setDevtoolsEndpointGetter(trpcEndpointMapper)
    .setEndpointMapper(trpcEndpointMapper)
    .setQueryParamsMapper(stringifyQueryParams)
    .setHeaderMapper(getTrpcHeaders)
    // The input is encoded by the fetcher, because queries and mutations send it in different places
    .setPayloadMapper(defaultMapper)
    .setFetcher(
      async ({
        request,
        queryParams,
        payload,
        adapterOptions,
        headers,
        onError,
        onResponseEnd,
        onTimeoutError,
        onRequestEnd,
        createAbortListener,
        getAbortController,
        onResponseProgress,
        onResponseStart,
        onBeforeRequest,
        onRequestStart,
        onRequestProgress,
        onSuccess,
      }) => {
        const controller = getAbortController();
        const { timeout: timeoutMs = defaultTimeout, ...restOptions } = adapterOptions || {};

        let timedOut = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let status = 0;
        let extra = trpcExtra;

        const unmountListener = createAbortListener({
          status: 0,
          extra: trpcExtra,
        });

        if (timeoutMs > 0 && controller) {
          timeoutId = setTimeout(() => {
            timedOut = true;
            unmountListener();
            controller.abort();
          }, timeoutMs);
        }

        onBeforeRequest();
        onRequestStart();

        try {
          const isMutation = request.method === TrpcMethods.MUTATION;
          const input = getTrpcInput(payload, transformer);

          const init: RequestInit = {
            ...restOptions,
            method: isMutation ? "POST" : "GET",
            headers: headers as Record<string, string>,
            signal: controller?.signal,
          };

          if (isMutation && input !== undefined) {
            init.body = input;

            const total = new Blob([input]).size;
            onRequestProgress({ total, loaded: total } as ProgressEvent);
          }

          onRequestEnd();

          const response = await fetch(getTrpcUrl(request, queryParams, input), init);

          onResponseStart();

          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          status = response.status;
          extra = { headers: responseHeaders };

          const body = await readBody(response, onResponseProgress);

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          onResponseEnd();
          unmountListener();

          const result = getTrpcResult(parseResponse(body), status, transformer);

          if (result.isSuccess) {
            onSuccess({ data: result.data, status, extra });
          } else {
            onError({ error: result.error, status, extra });
          }
        } catch (error: any) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          unmountListener();

          if (controller?.signal?.aborted) {
            if (timedOut) {
              onTimeoutError({ status: 0, extra: trpcExtra });
            }
            return;
          }

          onError({ error, status, extra });
        }
      },
    );
