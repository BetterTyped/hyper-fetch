import type { DefaultMapperType, QueryParamsType } from "@hyper-fetch/core";
import { parseResponse, getErrorMessage, Adapter, stringifyQueryParams } from "@hyper-fetch/core";

import { gqlExtra, defaultTimeout } from "./adapter.constants";
import type {
  GraphqlAdapterType,
  GraphQlExtraType,
  GraphQlEndpointType,
  FetchGraphqlAdapterOptionsType,
  GraphqlRequestOptionsType,
} from "./adapter.types";
import { GraphqlMethod } from "./adapter.types";
import {
  getGqlHeaders,
  getRequestValues,
  gqlEndpointMapper,
  gqlEndpointNameMapper,
  gqlRequestKeyMapper,
  gqlRequestNameMapper,
} from "./adapter.utils";

export const getGqlAdapter = (): GraphqlAdapterType =>
  new Adapter<
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
        const { fullUrl, payload } = getRequestValues(request, queryParams);

        const controller = getAbortController();
        const { timeout: timeoutMs = defaultTimeout, ...restOptions } = adapterOptions || {};

        let timedOut = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const unmountListener = createAbortListener({
          status: 0,
          extra: gqlExtra,
        });

        if (timeoutMs > 0 && controller) {
          timeoutId = setTimeout(() => {
            timedOut = true;
            unmountListener();
            controller.abort();
          }, timeoutMs);
        }

        const total = payload ? new Blob([payload]).size : 0;

        onBeforeRequest();
        onRequestStart(total ? { total, loaded: 0 } : undefined);

        try {
          const init: RequestInit = {
            method: request.method,
            headers: headers as Record<string, string>,
            signal: controller?.signal,
            ...restOptions,
          };

          if (payload) {
            init.body = payload;
          }

          const response = await fetch(fullUrl, init);

          // Fetch has no upload events. The response is the first sign that the whole body was sent.
          onRequestEnd();

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          onResponseStart();

          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          let body: string;

          if (response.body && typeof response.body.getReader === "function") {
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
              onResponseProgress({ total: contentLength || receivedLength, loaded: receivedLength } as ProgressEvent);
            }

            const allChunks = new Uint8Array(receivedLength);
            let position = 0;
            // eslint-disable-next-line no-restricted-syntax
            for (const chunk of chunks) {
              allChunks.set(chunk, position);
              position += chunk.length;
            }
            body = new TextDecoder().decode(allChunks);
          } else {
            body = await response.text();
          }

          onResponseEnd();
          unmountListener();

          const { status } = response;
          const parsed = parseResponse(body);
          const data = parsed?.data ?? null;
          // An empty `errors` list is not a failure
          const errors = Array.isArray(parsed?.errors) && parsed.errors.length === 0 ? null : parsed?.errors || null;
          const extensions = parsed?.extensions || {};
          const failure = errors || status > 399 || status === 0;

          if (failure) {
            const error = errors || [getErrorMessage()];
            onError({ error, status, extra: { headers: responseHeaders, extensions } });
          } else {
            onSuccess({
              data,
              error: errors,
              status,
              extra: { headers: responseHeaders, extensions },
            });
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
