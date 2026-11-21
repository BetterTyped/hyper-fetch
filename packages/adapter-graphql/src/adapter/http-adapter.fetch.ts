import type { DefaultMapperType, QueryParamsType } from "@hyper-fetch/core";
import { parseResponse, getErrorMessage, Adapter, stringifyQueryParams } from "@hyper-fetch/core";

import { gqlExtra, defaultTimeout, gqlAcceptHeader } from "./adapter.constants";
import type {
  GraphqlAdapterType,
  GraphQlExtraType,
  GraphQlEndpointType,
  FetchGraphqlAdapterOptionsType,
  GraphqlRequestOptionsType,
} from "./adapter.types";
import { GraphqlMethod } from "./adapter.types";
import {
  getGqlDocument,
  getGqlHeaders,
  getPersistedQueryHash,
  getPersistedQueryMiss,
  getRequestValues,
  gqlEndpointMapper,
  gqlEndpointNameMapper,
  gqlRequestKeyMapper,
  gqlRequestNameMapper,
} from "./adapter.utils";

export const getGqlAdapter = (): GraphqlAdapterType => {
  // Turned off for this adapter once the server reports that it does not support persisted queries
  let persistedQueriesSupported = true;

  return new Adapter<
    FetchGraphqlAdapterOptionsType,
    GraphqlMethod,
    number,
    GraphQlExtraType,
    QueryParamsType | string,
    QueryParamsType | string | undefined,
    GraphQlEndpointType,
    DefaultMapperType,
    DefaultMapperType,
    DefaultMapperType,
    DefaultMapperType,
    GraphqlRequestOptionsType
  >({
    name: "graphql",
    defaultMethod: GraphqlMethod.POST,
    defaultExtra: gqlExtra,
    systemErrorStatus: 0,
    systemErrorExtra: gqlExtra,
  })
    .onInitialize(({ client }) => {
      client.setCacheKeyMapper(gqlRequestKeyMapper);
      client.setQueryKeyMapper(gqlRequestKeyMapper);
      client.setAbortKeyMapper((request) => {
        return `${request.method}_${gqlRequestNameMapper(request)}-${request.cancelable}`;
      });
    })
    .setInternalErrorMapping((error) => [error])
    .setDevtoolsEndpointGetter((endpoint, requestOptions) =>
      gqlEndpointNameMapper(requestOptions?.document ?? endpoint),
    )
    .setEndpointMapper(gqlEndpointMapper)
    .setHeaderMapper(getGqlHeaders)
    .setQueryParamsMapper(stringifyQueryParams)
    .setFetcher(
      async ({
        request,
        queryParams,
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
        onSuccess,
      }) => {
        const controller = getAbortController();
        const {
          timeout: timeoutMs = defaultTimeout,
          errorPolicy = "none",
          persistedQueries = false,
          ...restOptions
        } = adapterOptions || {};

        let timedOut = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const unmountListener = createAbortListener({
          status: 0,
          extra: gqlExtra,
        });

        // One timeout for the whole operation - a persisted query miss and the request that registers it
        if (timeoutMs > 0 && controller) {
          timeoutId = setTimeout(() => {
            timedOut = true;
            unmountListener();
            controller.abort();
          }, timeoutMs);
        }

        // The hashed request goes first. Without Web Crypto the hash is null and the full query is sent.
        const sha256Hash =
          persistedQueries && persistedQueriesSupported
            ? await getPersistedQueryHash(gqlEndpointMapper(getGqlDocument(request)))
            : null;
        const persistedQuery = sha256Hash ? ({ version: 1, sha256Hash } as const) : null;
        const firstValues = getRequestValues(
          request,
          queryParams,
          persistedQuery ? { persistedQuery, withQuery: false } : undefined,
        );
        const total = firstValues.payload ? new Blob([firstValues.payload]).size : 0;

        onBeforeRequest();
        onRequestStart(total ? { total, loaded: 0 } : undefined);

        try {
          const requestHeaders = headers as Record<string, string>;
          const hasAcceptHeader = Object.keys(requestHeaders).some((key) => key.toLowerCase() === "accept");
          const init: RequestInit = {
            method: request.method,
            headers: hasAcceptHeader ? requestHeaders : { Accept: gqlAcceptHeader, ...requestHeaders },
            signal: controller?.signal,
            ...restOptions,
          };

          const sendAttempt = (values: { fullUrl: string; payload: string | null }) => {
            return fetch(values.fullUrl, values.payload ? { ...init, body: values.payload } : init);
          };

          const clearTimer = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          };

          /** Reads the body. Without `reportProgress` it reports the whole body at once, after reading it. */
          const readBody = async (response: Response, reportProgress: boolean) => {
            if (!response.body || typeof response.body.getReader !== "function") {
              return response.text();
            }

            const reader = response.body.getReader();
            const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
            let receivedLength = 0;
            const chunks: Uint8Array[] = [];

            // eslint-disable-next-line no-constant-condition
            while (true) {
              // eslint-disable-next-line no-await-in-loop
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              chunks.push(value);
              receivedLength += value.length;
              if (reportProgress) {
                onResponseProgress({ total: contentLength || receivedLength, loaded: receivedLength } as ProgressEvent);
              }
            }

            if (!reportProgress) {
              onResponseProgress({ total: receivedLength, loaded: receivedLength } as ProgressEvent);
            }

            const allChunks = new Uint8Array(receivedLength);
            let position = 0;
            // eslint-disable-next-line no-restricted-syntax
            for (const chunk of chunks) {
              allChunks.set(chunk, position);
              position += chunk.length;
            }
            return new TextDecoder().decode(allChunks);
          };

          let response = await sendAttempt(firstValues);
          // Fetch has no upload events. The response is the first sign that the whole body was sent.
          onRequestEnd();
          // The timeout covers the time to the response headers. A hashed request can still be a miss, so it waits.
          if (!persistedQuery) {
            clearTimer();
          }
          onResponseStart();

          // A hashed request can be a miss, so its body is reported only once it is known to be the answer
          let body = await readBody(response, !persistedQuery);

          const miss = persistedQuery ? getPersistedQueryMiss(parseResponse(body)) : null;
          if (persistedQuery && miss) {
            if (miss === "not-supported") {
              persistedQueriesSupported = false;
            }
            const persisted = miss === "not-found" ? { persistedQuery, withQuery: true } : undefined;
            response = await sendAttempt(getRequestValues(request, queryParams, persisted));
            clearTimer();
            body = await readBody(response, true);
          } else {
            clearTimer();
          }

          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          onResponseEnd();
          unmountListener();

          const { status } = response;
          const parsed = parseResponse(body);
          const data = parsed?.data ?? null;
          // An empty `errors` list is not a failure
          const errors = Array.isArray(parsed?.errors) && parsed.errors.length === 0 ? null : parsed?.errors || null;
          const extensions = parsed?.extensions || {};
          const extra = errors
            ? { headers: responseHeaders, extensions, errors }
            : { headers: responseHeaders, extensions };
          const failedStatus = status > 399 || status === 0;
          const keepsPartialData = errorPolicy === "all" && data !== null;
          const failure = failedStatus || (errors && !keepsPartialData);

          if (failure) {
            const error = errors || [getErrorMessage()];
            onError({ error, status, extra });
          } else {
            onSuccess({ data, status, extra });
          }
        } catch (error: any) {
          if (timeoutId) clearTimeout(timeoutId);
          unmountListener();

          if (controller?.signal?.aborted) {
            if (timedOut) {
              onTimeoutError({ status: 0, extra: gqlExtra });
            }
            return;
          }

          // Errors are always a list, like the GraphQL `errors` and the abort and timeout errors
          onError({ error: [error], status: 0, extra: gqlExtra });
        }
      },
    );
};
