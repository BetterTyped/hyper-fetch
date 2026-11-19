import { Adapter, getErrorMessage } from "adapter";
import { Client } from "client";

/**
 * Adapters may map internal errors into their own shape, e.g. GraphQL returns `[error]`. A user abort must still
 * end as canceled, and an adapter's own timeout must not.
 */
describe("Dispatcher [ Cancel detection ]", () => {
  const createAdapter = (mapping: (error: Error) => unknown) =>
    new Adapter({
      name: "mapped",
      defaultMethod: "GET",
      defaultExtra: {},
      systemErrorStatus: 0,
      systemErrorExtra: {},
    })
      .setInternalErrorMapping(mapping)
      // Behaves like the built-in adapters: reports the start, and on its own timeout stops listening for user
      // aborts before aborting the transport
      .setFetcher(({ onSuccess, onTimeoutError, onRequestStart, createAbortListener, getAbortController, request }) => {
        const unmountAbortListener = createAbortListener({ status: 0, extra: {} });
        const controller = getAbortController();
        onRequestStart();
        const timer = setTimeout(() => onSuccess({ data: { ok: true }, status: 200, extra: {} }), 100);
        controller?.signal.addEventListener("abort", () => clearTimeout(timer));
        if (request.endpoint === "/timeout") {
          setTimeout(() => {
            unmountAbortListener();
            controller?.abort();
            onTimeoutError({ status: 0, extra: {} });
          }, 5);
        }
      });

  const setup = (mapping: (error: Error) => unknown) => {
    const client = new Client({ url: "http://localhost" }).setAdapter(createAdapter(mapping));
    const details = vi.fn();
    client.requestManager.events.onResponse(({ details: responseDetails }) => details(responseDetails));
    return { client, details };
  };

  it.each([
    ["the error itself", (error: Error) => error],
    ["an array of errors", (error: Error) => [error]],
    ["an object wrapping it", (error: Error) => ({ errors: [error] })],
  ])("should mark user aborts as canceled when errors are mapped to %s", async (_name, mapping) => {
    const { client, details } = setup(mapping);
    const request = client.createRequest()({ endpoint: "/users", retry: 2, retryTime: 0 });
    const unmount = client.requestManager.events.onRequestStart(() => {
      unmount();
      request.abort();
    });

    const response = await request.send();

    expect(response.success).toBeFalse();
    expect(details).toHaveBeenCalledOnce();
    expect(details.mock.calls[0][0]).toMatchObject({ isCanceled: true, willRetry: false });
  });

  it("should not mark an adapter timeout as canceled", async () => {
    const { client, details } = setup((error) => [error]);
    const request = client.createRequest()({ endpoint: "/timeout" });

    const response = await request.send();

    expect(response.success).toBeFalse();
    expect(response.error).toMatchObject({ message: getErrorMessage("timeout").message });
    expect(details.mock.calls.at(-1)?.[0].isCanceled).toBeFalse();
  });
});
