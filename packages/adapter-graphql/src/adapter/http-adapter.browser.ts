import {
  getResponseHeaders,
  parseResponse,
  getErrorMessage,
  Adapter,
  QueryParamsType,
  stringifyKey,
} from "@hyper-fetch/core";

import {
  gqlExtra,
  GraphqlAdapterType,
  defaultTimeout,
  getRequestValues,
  GraphqlMethod,
  GraphQlExtraType,
  GraphQlEndpointType,
  gqlEndpointMapper,
  gqlEndpointNameMapper,
} from "adapter";

export const getGqlAdapter = (): GraphqlAdapterType =>
  new Adapter<
    Partial<XMLHttpRequest>,
    GraphqlMethod,
    number,
    GraphQlExtraType,
    QueryParamsType | string,
    undefined,
    GraphQlEndpointType
  >({
    name: "graphql-browser",
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
        onResponseProgress,
        onRequestProgress,
        onResponseStart,
        onBeforeRequest,
        onRequestStart,
        onSuccess,
      }) => {
        const { fullUrl, payload } = getRequestValues(request);

        const xhr = new XMLHttpRequest();
        xhr.timeout = defaultTimeout;

        const onAbort = () => xhr.abort();

        // Inject xhr options
        if (adapterOptions) {
          Object.entries(adapterOptions).forEach(([name, value]) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            xhr[name] = value;
          });
        }

        // Open connection
        xhr.open(request.method, fullUrl, true);

        // Set Headers
        Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value as string));

        // Listen to abort signal
        const unmountListener = createAbortListener({ status: 0, extra: gqlExtra, onAbort });

        // Request handlers
        xhr.upload.onprogress = onRequestProgress;

        // Response handlers
        xhr.onloadstart = (): void => {
          onRequestEnd();
          onResponseStart();
        };

        xhr.onprogress = onResponseProgress;

        xhr.onloadend = () => {
          onResponseEnd();
          unmountListener();
        };

        /* istanbul ignore next */
        xhr.ontimeout = () => onTimeoutError({ status: 0, extra: gqlExtra });

        // Data handler
        xhr.onreadystatechange = (e: Event) => {
          const event = e as unknown as ProgressEvent<XMLHttpRequest>;
          const finishedState = 4;

          if (event.target && event.target.readyState === finishedState) {
            const { status } = event.target;
            const response = parseResponse(event.target.response);
            const data = response.data ?? null;
            const errors = response?.errors || null;
            const extensions = response?.extensions || {};
            const failure = response?.errors || status > 399 || status === 0;
            const responseHeaders = getResponseHeaders(xhr.getAllResponseHeaders());

            if (failure) {
              const error = errors || [getErrorMessage()];
              // delay to finish after onabort/ontimeout
              onError({ error, status, extra: { headers: responseHeaders, extensions } });
            } else {
              onSuccess({
                data,
                error: errors,
                status,
                extra: { headers: responseHeaders, extensions },
              });
            }
          }
        };

        // Start request
        onBeforeRequest();
        onRequestStart();

        xhr.send(payload);
      },
    );
