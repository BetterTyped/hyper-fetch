import type { DefaultMapperType, QueryParamsType } from "@hyper-fetch/core";
import { Adapter, defaultMapper, stringifyQueryParams } from "@hyper-fetch/core";

import { defaultTimeout, OrpcMethods, orpcExtra } from "./adapter.constants";
import type {
  FetchOrpcAdapterOptionsType,
  OrpcAdapterOptionsType,
  OrpcAdapterType,
  OrpcExtraType,
  OrpcMethod,
} from "./adapter.types";
import {
  createOrpcSerializer,
  getOrpcAbortKey,
  getOrpcHeaders,
  getOrpcHttpRequest,
  getOrpcRequestKey,
  getOrpcResult,
  orpcEndpointMapper,
} from "./adapter.utils";

const readBody = async (response: Response, onProgress: (progress: ProgressEvent) => void) => {
  // Outputs with files are sent as multipart form data
  if (response.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return response.formData();
  }

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

const getBodySize = (body: string | FormData | undefined) => {
  if (body === undefined) {
    return 0;
  }
  if (typeof body === "string") {
    return new Blob([body]).size;
  }

  let size = 0;
  body.forEach((value) => {
    size += typeof value === "string" ? new Blob([value]).size : value.size;
  });
  return size;
};

export const getOrpcAdapter = ({
  queryMethod: defaultQueryMethod = "POST",
  customJsonSerializers,
}: OrpcAdapterOptionsType = {}): OrpcAdapterType => {
  const serializer = createOrpcSerializer(customJsonSerializers);

  return (
    new Adapter<
      FetchOrpcAdapterOptionsType,
      OrpcMethod,
      number,
      OrpcExtraType,
      QueryParamsType | string,
      QueryParamsType | string | undefined,
      string,
      DefaultMapperType,
      DefaultMapperType,
      DefaultMapperType,
      DefaultMapperType
    >({
      name: "orpc",
      defaultMethod: OrpcMethods.QUERY,
      defaultExtra: orpcExtra,
      systemErrorStatus: 0,
      systemErrorExtra: orpcExtra,
    })
      .onInitialize(({ client }) => {
        client.setCacheKeyMapper((request) => getOrpcRequestKey(request, serializer));
        client.setQueryKeyMapper((request) => getOrpcRequestKey(request, serializer));
        client.setAbortKeyMapper((request) => getOrpcAbortKey(request));
      })
      // Queries are safe reads, the same as GET in the HttpAdapter
      .setRequestDefaults((options) => {
        const method = options.method ?? OrpcMethods.QUERY;
        return method === OrpcMethods.QUERY ? { deduplicate: true } : {};
      })
      .setDevtoolsEndpointGetter(orpcEndpointMapper)
      .setEndpointMapper(orpcEndpointMapper)
      .setQueryParamsMapper(stringifyQueryParams)
      .setHeaderMapper(getOrpcHeaders)
      // The input is encoded by the fetcher, because the method decides where it is sent
      .setPayloadMapper(defaultMapper)
      .setFetcher(
        async ({
          request,
          endpoint,
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
          const {
            timeout: timeoutMs = defaultTimeout,
            queryMethod = defaultQueryMethod,
            ...restOptions
          } = adapterOptions ?? {};

          let timedOut = false;
          let timeoutId: ReturnType<typeof setTimeout> | undefined;
          let status = 0;
          let extra = orpcExtra;

          const unmountListener = createAbortListener({
            status: 0,
            extra: orpcExtra,
          });

          // The listener above throws when the controller is missing
          const controller = getAbortController() as AbortController;

          if (timeoutMs > 0) {
            timeoutId = setTimeout(() => {
              timedOut = true;
              unmountListener();
              controller.abort();
            }, timeoutMs);
          }

          onBeforeRequest();
          onRequestStart();

          try {
            const httpRequest = getOrpcHttpRequest({
              request,
              endpoint,
              queryParams,
              headers,
              payload,
              queryMethod,
              serializer,
            });

            const total = getBodySize(httpRequest.body);
            if (total) {
              onRequestProgress({ total, loaded: total } as ProgressEvent);
            }

            onRequestEnd();

            const response = await fetch(httpRequest.url, {
              ...restOptions,
              method: httpRequest.method,
              headers: httpRequest.headers,
              body: httpRequest.body,
              signal: controller.signal,
            });

            onResponseStart();

            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
              responseHeaders[key] = value;
            });

            status = response.status;
            extra = { headers: responseHeaders };

            const body = await readBody(response, onResponseProgress);

            clearTimeout(timeoutId);

            onResponseEnd();
            unmountListener();

            const result = getOrpcResult({ body, status, serializer });

            if (result.isSuccess) {
              onSuccess({ data: result.data, status, extra });
            } else {
              onError({ error: result.error, status, extra });
            }
          } catch (error) {
            clearTimeout(timeoutId);
            unmountListener();

            if (controller.signal.aborted) {
              if (timedOut) {
                onTimeoutError({ status: 0, extra: orpcExtra });
              }
              return;
            }

            onError({ error, status, extra });
          }
        },
      )
  );
};
