import { DeletedError } from "adapter";
import { Client } from "client";

const createDeferred = <T = void>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

/**
 * The dispatcher removes a request from its queue right after emitting the response. That removal must neither win
 * over a finished response whose async mapper is still running, nor get lost for a request that waits for a retry.
 */
describe("Request [ Async response mapper and removal ]", () => {
  const fast = { requestTime: 0, responseTime: 0 };

  let client = new Client({ url: "http://mocked" });

  beforeEach(() => {
    client = new Client({ url: "http://mocked" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createRequest = () =>
    client.createRequest<{ response: string; error: { message: string } }>()({ endpoint: "/mapped", method: "POST" });

  it("should resolve with the mapped response and not report a removal", async () => {
    const request = createRequest()
      .setMock(() => ({ data: "plain", status: 200 }), fast)
      .setResponseMapper(async (response) => ({ ...response, data: `${response.data} mapped` }) as typeof response);
    const onRemove = vi.fn();
    const onResponse = vi.fn();

    const { data, success, error } = await request.send({ onRemove, onResponse });

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(data).toBe("plain mapped");
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("should resolve with the mapped error of a failed request and not report a removal", async () => {
    const request = createRequest()
      .setMock(() => ({ error: { message: "nope" }, status: 400, success: false }), fast)
      .setResponseMapper(async (response) => ({ ...response, error: { message: "mapped nope" } }) as typeof response);
    const onRemove = vi.fn();

    const { data, success, error, status } = await request.send({ onRemove });

    expect(success).toBe(false);
    expect(status).toBe(400);
    expect(data).toBeNull();
    expect(error).toEqual({ message: "mapped nope" });
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("should resolve with the deleted error when removed while the mapper of a retried attempt is running", async () => {
    // The retry timer never fires - only the removal can end this request
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const mapperStarted = createDeferred();
    const mapperGate = createDeferred();
    const request = createRequest()
      .setRetry(1)
      .setRetryTime(60_000)
      .setMock(() => ({ error: { message: "failed" }, status: 500, success: false }), fast)
      .setResponseMapper(async (response) => {
        mapperStarted.resolve();
        await mapperGate.promise;
        return response;
      });
    const onRemove = vi.fn();
    const onResponse = vi.fn();
    let requestId = "";

    const response = request.send({
      onBeforeSent: (event) => {
        requestId = event.requestId;
      },
      onRemove,
      onResponse,
    });
    await mapperStarted.promise;
    client.submitDispatcher.delete(request.queryKey, requestId, request.abortKey);

    // The removal ends the request right away, without waiting for the mapper that is still running
    const { data, error, success, status } = await response;

    expect(success).toBe(false);
    expect(data).toBeNull();
    expect(status).toBeNull();
    expect(error).toBeInstanceOf(DeletedError);
    expect(onRemove).toHaveBeenCalledTimes(1);

    // The mapper finishing later changes nothing
    mapperGate.resolve();
    await mapperGate.promise;
    await Promise.resolve();

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onResponse).not.toHaveBeenCalled();
  });

  it("should resolve with the deleted error when removed while waiting for a retry after the mapper finished", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const mapped = createDeferred();
    const request = createRequest()
      .setRetry(1)
      .setRetryTime(60_000)
      .setMock(() => ({ error: { message: "failed" }, status: 500, success: false }), fast)
      .setResponseMapper(async (response) => {
        // Resolved after this mapper returned, so the send call handled the attempt before the test continues
        queueMicrotask(() => queueMicrotask(() => mapped.resolve()));
        return response;
      });
    const onRemove = vi.fn();
    let requestId = "";

    const response = request.send({
      onBeforeSent: (event) => {
        requestId = event.requestId;
      },
      onRemove,
    });
    await mapped.promise;
    client.submitDispatcher.delete(request.queryKey, requestId, request.abortKey);
    const { error, success } = await response;

    expect(success).toBe(false);
    expect(error).toBeInstanceOf(DeletedError);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
