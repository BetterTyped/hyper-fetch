import { Client } from "client";
import type { RetryTimeType } from "request";
import { exponentialBackoff } from "request";

describe("Dispatcher [ Retry time ]", () => {
  const createResponse = (status: number) => ({
    data: null,
    error: new Error("Request failed"),
    status,
    success: false,
    extra: {},
    requestTimestamp: Date.now(),
    responseTimestamp: Date.now(),
  });

  let client = new Client({ url: "shared-base-url" });
  let fetchSpy = vi.spyOn(client.adapter, "fetch");

  /** Times of the attempts, counted from the first one */
  const getAttemptTimes = (start: number) => fetchSpy.mock.results.map((_, index) => attemptTimes[index] - start);
  let attemptTimes: number[] = [];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    client = new Client({ url: "shared-base-url" });
    attemptTimes = [];
    fetchSpy = vi.spyOn(client.adapter, "fetch").mockImplementation((async () => {
      attemptTimes.push(Date.now());
      return createResponse(500);
    }) as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("When the retry time is a function", () => {
    it("should wait the delay returned for every attempt", async () => {
      const retryTime = vi.fn(({ attempt }: { attempt: number }) => (attempt + 1) * 100);
      const request = client.createRequest()({ endpoint: "/retry", retry: 3, retryTime });
      const start = Date.now();

      request.send();
      await vi.advanceTimersByTimeAsync(1000);

      expect(fetchSpy).toHaveBeenCalledTimes(4);
      expect(getAttemptTimes(start)).toStrictEqual([0, 100, 300, 600]);
      expect(retryTime.mock.calls.map(([{ attempt }]) => attempt)).toStrictEqual([0, 1, 2]);
    });

    it("should give the failed response to the function", async () => {
      const retryTime = vi.fn(() => 0);
      const request = client.createRequest()({ endpoint: "/retry", retry: 1, retryTime });

      request.send();
      await vi.advanceTimersByTimeAsync(0);

      expect(retryTime).toHaveBeenCalledWith(
        expect.objectContaining({ attempt: 0, response: expect.objectContaining({ status: 500 }) }),
      );
    });

    it("should take the function with setRetryTime", async () => {
      const request = client
        .createRequest()({ endpoint: "/retry", retry: 1 })
        .setRetryTime(() => 250);
      const start = Date.now();

      request.send();
      await vi.advanceTimersByTimeAsync(1000);

      expect(getAttemptTimes(start)).toStrictEqual([0, 250]);
    });

    it("should not retry when the function throws", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 3,
        retryTime: () => {
          throw new Error("Broken delay");
        },
      });
      const onSettled = vi.fn();

      request.send().then(onSettled);
      await vi.advanceTimersByTimeAsync(1000);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(onSettled).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: 500, success: false }));
    });

    it.each([Number.NaN, -100, Infinity])("should retry right away when the function returns %s", async (value) => {
      const request = client.createRequest()({ endpoint: "/retry", retry: 1, retryTime: () => value });

      request.send();
      await vi.advanceTimersByTimeAsync(0);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("When using the exponential backoff", () => {
    it("should double the delay without jitter up to the maximum", async () => {
      const request = client.createRequest()({
        endpoint: "/retry",
        retry: 5,
        retryTime: exponentialBackoff({ min: 100, max: 500, jitter: false }),
      });
      const start = Date.now();

      request.send();
      await vi.advanceTimersByTimeAsync(5000);

      // Delays: 100, 200, 400, 500, 500
      expect(getAttemptTimes(start)).toStrictEqual([0, 100, 300, 700, 1200, 1700]);
    });

    it("should spread the delay between the minimum and the backoff window with jitter", () => {
      const backoff = exponentialBackoff({ min: 100, max: 10_000, random: () => 0.5 });
      const response = createResponse(500);

      expect(backoff({ attempt: 0, response })).toBe(150);
      expect(backoff({ attempt: 3, response })).toBe(500);
      expect(backoff({ attempt: 20, response })).toBe(5050);
    });

    it("should use the defaults", () => {
      const backoff = exponentialBackoff({ random: () => 1 });
      const response = createResponse(500);

      expect(backoff({ attempt: 0, response })).toBe(1000);
      expect(backoff({ attempt: 50, response })).toBe(30_000);
    });

    it("should be accepted as the retry time type", () => {
      const retryTime: RetryTimeType = exponentialBackoff();

      expect(retryTime).toBeFunction();
    });
  });
});
