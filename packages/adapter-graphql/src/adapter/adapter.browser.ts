import { GraphQLError } from "graphql";
import { getAdapterBindings, getResponseHeaders, parseResponse, parseErrorResponse } from "@hyper-fetch/core";

import { gqlExtra, GraphQLAdapterType, defaultTimeout, getRequestValues } from "adapter";

export const adapter: GraphQLAdapterType = async (request, requestId) => {
  const {
    makeRequest,
    config,
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
  } = await getAdapterBindings<GraphQLAdapterType>({
    request,
    requestId,
    systemErrorStatus: 0,
    systemErrorExtra: gqlExtra,
    internalErrorFormatter: (error) => ({
      errors: [error] satisfies readonly Partial<GraphQLError>[],
    }),
  });

  const { fullUrl, payload, method } = getRequestValues(request);

  return makeRequest((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = defaultTimeout;

    const abort = () => xhr.abort();

    // Inject xhr options
    Object.entries(config).forEach(([name, value]) => {
      xhr[name] = value;
    });

    // Open connection
    xhr.open(method, fullUrl, true);

    // Set Headers
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value as string));

    // Listen to abort signal
    const unmountListener = createAbortListener(0, gqlExtra, abort, resolve);

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

    xhr.ontimeout = () => onTimeoutError(0, gqlExtra, resolve);

    // Data handler
    xhr.onreadystatechange = (e: Event) => {
      const event = e as unknown as ProgressEvent<XMLHttpRequest>;
      const finishedState = 4;

      if (event.target && event.target.readyState === finishedState) {
        const { status } = event.target;
        const response = parseResponse(event.target.response);
        console.log({ response });
        const data = response?.data;
        const extensions = response?.extensions || {};
        const success = (String(status).startsWith("2") || String(status).startsWith("3")) && !data?.errors;
        const responseHeaders = getResponseHeaders(xhr.getAllResponseHeaders());

        if (success) {
          onSuccess(data, status, { headers: responseHeaders, extensions }, resolve);
        } else {
          // delay to finish after onabort/ontimeout
          const error = data || parseErrorResponse(event.target.response);
          onError(error, status, { headers: responseHeaders, extensions }, resolve);
        }
      }
    };

    // Start request
    onBeforeRequest();
    onRequestStart();

    xhr.send(payload);
  });
};
