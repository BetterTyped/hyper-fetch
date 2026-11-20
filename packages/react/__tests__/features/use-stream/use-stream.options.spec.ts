import type { RequestInstance } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useStream } from "hooks/use-stream";

import { client } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useStream [ Options ]", () => {
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client.clear();
    resetMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should keep the adapter options of the request when it turns streaming on", async () => {
    const request = client.createRequest<{ response: { value: string } }>()({
      endpoint: "/stream-options",
      options: { timeout: 1234, credentials: "include" },
    });
    mockRequest(request, { data: { value: "streamed" }, delay: 0 });
    const fetchSpy = vi.spyOn(client.adapter, "fetch");

    const { result } = renderHook(() => useStream(request));
    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.done).toBeTrue();
    });
    expect(result.current.text).toBe(JSON.stringify({ value: "streamed" }));
    const [sentRequest] = fetchSpy.mock.calls[0] as [RequestInstance, string];
    expect(sentRequest.options).toStrictEqual({ timeout: 1234, credentials: "include", streaming: true });
  });

  it("should turn streaming on for a request without adapter options", async () => {
    const request = client.createRequest<{ response: { value: string } }>()({ endpoint: "/stream-no-options" });
    mockRequest(request, { data: { value: "streamed" }, delay: 0 });
    const fetchSpy = vi.spyOn(client.adapter, "fetch");

    const { result } = renderHook(() => useStream(request));
    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.done).toBeTrue();
    });
    const [sentRequest] = fetchSpy.mock.calls[0] as [RequestInstance, string];
    expect(sentRequest.options).toStrictEqual({ streaming: true });
  });
});
