/* eslint-disable */
/* tslint:disable */

/**
 * Mock Service Worker (0.42.1).
 * @see https://github.com/mswjs/msw
 * - Please do NOT modify this file.
 * - Please do NOT serve this file on production.
 */

const INTEGRITY_CHECKSUM = "02f4ad4a2797f85668baf196e553d929";
const bypassHeaderName = "x-msw-bypass";
const activeAdapterIds = new Set();

self.addEventListener("install", function () {
  return self.skipWaiting();
});

self.addEventListener("activate", async function (event) {
  return self.adapters.claim();
});

self.addEventListener("message", async function (event) {
  const adapterId = event.source.id;

  if (!adapterId || !self.adapters) {
    return;
  }

  const adapter = await self.adapters.get(adapterId);

  if (!adapter) {
    return;
  }

  const allAdapters = await self.adapters.matchAll();

  switch (event.data) {
    case "KEEPALIVE_REQUEST": {
      sendToAdapter(adapter, {
        type: "KEEPALIVE_RESPONSE",
      });
      break;
    }

    case "INTEGRITY_CHECK_REQUEST": {
      sendToAdapter(adapter, {
        type: "INTEGRITY_CHECK_RESPONSE",
        payload: INTEGRITY_CHECKSUM,
      });
      break;
    }

    case "MOCK_ACTIVATE": {
      activeAdapterIds.add(adapterId);

      sendToAdapter(adapter, {
        type: "MOCKING_ENABLED",
        payload: true,
      });
      break;
    }

    case "MOCK_DEACTIVATE": {
      activeAdapterIds.delete(adapterId);
      break;
    }

    case "CLIENT_CLOSED": {
      activeAdapterIds.delete(adapterId);

      const remainingAdapters = allAdapters.filter((adapter) => {
        return adapter.id !== adapterId;
      });

      // Unregister itself when there are no more adapters
      if (remainingAdapters.length === 0) {
        self.registration.unregister();
      }

      break;
    }
  }
});

// Resolve the "main" adapter for the given event.
// Adapter that issues a request doesn't necessarily equal the adapter
// that registered the worker. It's with the latter the worker should
// communicate with during the response resolving phase.
async function resolveMainAdapter(event) {
  const adapter = await self.adapters.get(event.adapterId);

  if (adapter.frameType === "top-level") {
    return adapter;
  }

  const allAdapters = await self.adapters.matchAll();

  return allAdapters
    .filter((adapter) => {
      // Get only those adapters that are currently visible.
      return adapter.visibilityState === "visible";
    })
    .find((adapter) => {
      // Find the adapter ID that's recorded in the
      // set of adapters that have registered the worker.
      return activeAdapterIds.has(adapter.id);
    });
}

async function handleRequest(event, requestId) {
  const adapter = await resolveMainAdapter(event);
  const response = await getResponse(event, adapter, requestId);

  // Send back the response clone for the "response:*" life-cycle events.
  // Ensure MSW is active and ready to handle the message, otherwise
  // this message will pend indefinitely.
  if (adapter && activeAdapterIds.has(adapter.id)) {
    (async function () {
      const clonedResponse = response.clone();
      sendToAdapter(adapter, {
        type: "RESPONSE",
        payload: {
          requestId,
          type: clonedResponse.type,
          ok: clonedResponse.ok,
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          body: clonedResponse.body === null ? null : await clonedResponse.text(),
          headers: serializeHeaders(clonedResponse.headers),
          redirected: clonedResponse.redirected,
        },
      });
    })();
  }

  return response;
}

async function getResponse(event, adapter, requestId) {
  const { request } = event;
  const requestClone = request.clone();
  const getOriginalResponse = () => fetch(requestClone);

  // Bypass mocking when the request adapter is not active.
  if (!adapter) {
    return getOriginalResponse();
  }

  // Bypass initial page load requests (i.e. static assets).
  // The absence of the immediate/parent adapter in the map of the active adapters
  // means that MSW hasn't dispatched the "MOCK_ACTIVATE" event yet
  // and is not ready to handle requests.
  if (!activeAdapterIds.has(adapter.id)) {
    return await getOriginalResponse();
  }

  // Bypass requests with the explicit bypass header
  if (requestClone.headers.get(bypassHeaderName) === "true") {
    const cleanRequestHeaders = serializeHeaders(requestClone.headers);

    // Remove the bypass header to comply with the CORS preflight check.
    delete cleanRequestHeaders[bypassHeaderName];

    const originalRequest = new Request(requestClone, {
      headers: new Headers(cleanRequestHeaders),
    });

    return fetch(originalRequest);
  }

  // Send the request to the adapter-side MSW.
  const reqHeaders = serializeHeaders(request.headers);
  const body = await request.text();

  const adapterMessage = await sendToAdapter(adapter, {
    type: "REQUEST",
    payload: {
      id: requestId,
      url: request.url,
      method: request.method,
      headers: reqHeaders,
      cache: request.cache,
      mode: request.mode,
      credentials: request.credentials,
      destination: request.destination,
      integrity: request.integrity,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      body,
      bodyUsed: request.bodyUsed,
      keepalive: request.keepalive,
    },
  });

  switch (adapterMessage.type) {
    case "MOCK_SUCCESS": {
      return delayPromise(() => respondWithMock(adapterMessage), adapterMessage.payload.delay);
    }

    case "MOCK_NOT_FOUND": {
      return getOriginalResponse();
    }

    case "NETWORK_ERROR": {
      const { name, message } = adapterMessage.payload;
      const networkError = new Error(message);
      networkError.name = name;

      // Rejecting a request Promise emulates a network error.
      throw networkError;
    }

    case "INTERNAL_ERROR": {
      const parsedBody = JSON.parse(adapterMessage.payload.body);

      console.error(
        `\
[MSW] Uncaught exception in the request handler for "%s %s":

${parsedBody.location}

This exception has been gracefully handled as a 500 response, however, it's strongly recommended to resolve this error, as it indicates a mistake in your code. If you wish to mock an error response, please see this guide: https://mswjs.io/docs/recipes/mocking-error-responses\
`,
        request.method,
        request.url,
      );

      return respondWithMock(adapterMessage);
    }
  }

  return getOriginalResponse();
}

self.addEventListener("fetch", function (event) {
  const { request } = event;
  const accept = request.headers.get("accept") || "";

  // Bypass server-sent events.
  if (accept.includes("text/event-stream")) {
    return;
  }

  // Bypass navigation requests.
  if (request.mode === "navigate") {
    return;
  }

  // Opening the DevTools triggers the "only-if-cached" request
  // that cannot be handled by the worker. Bypass such requests.
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return;
  }

  // Bypass all requests when there are no active adapters.
  // Prevents the self-unregistered worked from handling requests
  // after it's been deleted (still remains active until the next reload).
  if (activeAdapterIds.size === 0) {
    return;
  }

  const requestId = uuidv4();

  return event.respondWith(
    handleRequest(event, requestId).catch((error) => {
      if (error.name === "NetworkError") {
        console.warn(
          '[MSW] Successfully emulated a network error for the "%s %s" request.',
          request.method,
          request.url,
        );
        return;
      }

      // At this point, any exception indicates an issue with the original request/response.
      console.error(
        `\
[MSW] Caught an exception from the "%s %s" request (%s). This is probably not a problem with Mock Service Worker. There is likely an additional logging output above.`,
        request.method,
        request.url,
        `${error.name}: ${error.message}`,
      );
    }),
  );
});

function serializeHeaders(headers) {
  const reqHeaders = {};
  headers.forEach((value, name) => {
    reqHeaders[name] = reqHeaders[name] ? [].concat(reqHeaders[name]).concat(value) : value;
  });
  return reqHeaders;
}

function sendToAdapter(adapter, message) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();

    channel.port1.onmessage = (event) => {
      if (event.data && event.data.error) {
        return reject(event.data.error);
      }

      resolve(event.data);
    };

    adapter.postMessage(JSON.stringify(message), [channel.port2]);
  });
}

function delayPromise(cb, duration) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(cb()), duration);
  });
}

function respondWithMock(adapterMessage) {
  return new Response(adapterMessage.payload.body, {
    ...adapterMessage.payload,
    headers: adapterMessage.payload.headers,
  });
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
