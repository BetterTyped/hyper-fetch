import { getErrorMessage } from "adapter";
import { Client } from "client";
import { Plugin } from "plugin";

/** A mocked request reports exactly one outcome: success, error, abort or timeout - never two. */
describe("Mocker [ Errors are reported once ]", () => {
  const createSetup = (config: { requestTime?: number; responseTime?: number; timeout?: number } = {}) => {
    const onRequestError = vi.fn();
    const onRequestSuccess = vi.fn();
    const onRequestFinished = vi.fn();
    const plugin = new Plugin({ name: "outcomes" })
      .onRequestError(onRequestError)
      .onRequestSuccess(onRequestSuccess)
      .onRequestFinished(onRequestFinished);
    const client = new Client({ url: "http://mocker-errors.test" }).addPlugin(plugin);
    const request = client
      .createRequest<{ response: { ok: boolean } }>()({ endpoint: "/outcome" })
      .setMock(() => ({ data: { ok: true }, status: 200 }), {
        requestTime: 0,
        responseTime: 0,
        ...config,
      });
    return { client, request, onRequestError, onRequestSuccess, onRequestFinished };
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should report an abort once", async () => {
    const { request, onRequestError, onRequestSuccess, onRequestFinished } = createSetup({
      requestTime: 50,
      responseTime: 50,
    });

    const sent = request.send();
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    request.abort();
    const response = await sent;

    expect(response.error).toEqual(getErrorMessage("abort"));
    expect(onRequestError).toHaveBeenCalledTimes(1);
    expect(onRequestFinished).toHaveBeenCalledTimes(1);
    expect(onRequestSuccess).not.toHaveBeenCalled();
  });

  it("should report a timeout once and nothing after it", async () => {
    vi.useFakeTimers();
    const { request, onRequestError, onRequestSuccess, onRequestFinished } = createSetup({
      requestTime: 100,
      responseTime: 100,
      timeout: 30,
    });

    const sent = request.send();
    await vi.advanceTimersByTimeAsync(1000);
    const response = await sent;

    expect(response.error).toEqual(getErrorMessage("timeout"));
    expect(onRequestError).toHaveBeenCalledTimes(1);
    expect(onRequestError).toHaveBeenCalledWith(
      expect.objectContaining({ response: expect.objectContaining({ error: getErrorMessage("timeout") }) }),
    );
    expect(onRequestFinished).toHaveBeenCalledTimes(1);
    expect(onRequestSuccess).not.toHaveBeenCalled();
  });

  it("should not report a timeout after the request already succeeded", async () => {
    vi.useFakeTimers();
    const { request, onRequestError, onRequestSuccess, onRequestFinished } = createSetup({ timeout: 500 });

    const sent = request.send();
    await vi.advanceTimersByTimeAsync(100);
    const response = await sent;
    await vi.advanceTimersByTimeAsync(2000);

    expect(response.data).toEqual({ ok: true });
    expect(onRequestSuccess).toHaveBeenCalledTimes(1);
    expect(onRequestFinished).toHaveBeenCalledTimes(1);
    expect(onRequestError).not.toHaveBeenCalled();
  });

  it("should report a request aborted before it started once", async () => {
    const { request, onRequestError, onRequestFinished } = createSetup({ requestTime: 20 });

    const sent = request.send({
      onBeforeSent: () => {
        request.abort();
      },
    });
    const response = await sent;

    expect(response.error).toEqual(getErrorMessage("abort"));
    expect(onRequestError.mock.calls.length).toBeLessThanOrEqual(1);
    expect(onRequestFinished.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
