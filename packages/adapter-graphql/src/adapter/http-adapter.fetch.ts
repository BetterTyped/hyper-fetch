import type { QueryParamsType } from "@hyper-fetch/core";
import { parseResponse, getErrorMessage, Adapter, stringifyKey } from "@hyper-fetch/core";

import type {
  GraphqlAdapterType,
  GraphQlExtraType,
  GraphQlEndpointType,
  FetchGraphqlAdapterOptionsType,
} from "adapter";
import {
  gqlExtra,
  defaultTimeout,
  getRequestValues,
  GraphqlMethod,
  gqlEndpointMapper,
  gqlEndpointNameMapper,
} from "adapter";

export const getGqlAdapter = (): GraphqlAdapterType =>
  new Adapter<
    FetchGraphqlAdapterOptionsType,
    GraphqlMethod,
    number,
    GraphQlExtraType,
    QueryParamsType | string,
    undefined,
    GraphQlEndpointType
  >({
    name: "graphql",
    defaultMethod: GraphqlMethod.POST,
    defaultExtra: gqlExtra,
    systemErrorStatus: 0,
    systemErrorExtra: gqlExtra,
  })
    .onInitialize(({ client }) => {
      client.setCacheKeyMapper((request) => {
        return `${request.method}_${gqlEndpointNameMapper(request.endpoint)}-${stringifyKey(request.params)}-${stringifyKey(request.queryParams)}`;
      });
      client.setQueryKeyMapper((request) => {
        return `${request.method}_${gqlEndpointNameMapper(request.endpoint)}-${stringifyKey(request.params)}-${stringifyKey(request.queryParams)}`;
      });
      client.setAbortKeyMapper((request) => {
        return `${request.method}_${gqlEndpointNameMapper(request.endpoint)}-${request.cancelable}`;
      });
    })
    .setInternalErrorMapping((error) => [error])
    .setDevtoolsEndpointGetter(gqlEndpointNameMapper)
    .setEndpointMapper(gqlEndpointMapper)
    .setFetcher(
      async ({
        request,
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
        const { fullUrl, payload } = getRequestValues(request);

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

        onBeforeRequest();
        onRequestStart();

        try {
          const init: RequestInit = {
            method: request.method,
            headers: headers as Record<string, string>,
            signal: controller?.signal,
            ...restOptions,
          };

          if (payload) {
            init.body = payload;

            if (typeof payload === "string") {
              const total = new Blob([payload]).size;
              onRequestProgress({ total, loaded: total } as ProgressEvent);
            }
          }

          onRequestEnd();

          const response = await fetch(fullUrl, init);

          if (timeoutId) clearTimeout(timeoutId);

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
              if (done) break;
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
          const errors = parsed?.errors || null;
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
        } catch (err: any) {
          if (timeoutId) clearTimeout(timeoutId);
          unmountListener();

          if (controller?.signal?.aborted) {
            if (timedOut) {
              onTimeoutError({ status: 0, extra: gqlExtra });
            }
            return;
          }

          onError({ error: err, status: 0, extra: gqlExtra });
        }
      },
    );
