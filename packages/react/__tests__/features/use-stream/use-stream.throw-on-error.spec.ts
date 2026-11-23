import { act, renderHook, waitFor } from "@testing-library/react";
import { useStream } from "hooks/use-stream";

import { client } from "../../utils";

/**
 * `throwOnError` of a request makes `send()` reject - the hook sends the request itself and reports failures through
 * its state, so a request configured for React Query or SWR keeps working with it.
 */
describe("useStream [ throwOnError ]", () => {
  let fetchSpy = vi.spyOn(globalThis, "fetch");

  beforeEach(() => {
    client.clear();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ message: "Server error" }), {
          status: 500,
        }),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should report the failed response in the state instead of rejecting", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const request = client
      .createRequest<{
        response: ReadableStream<Uint8Array>;
      }>()({ endpoint: "/stream" })
      .setThrowOnError(true);
    const { result } = renderHook(() => useStream(request));

    await act(async () => {
      result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe(500));
    process.off("unhandledRejection", unhandled);

    expect(result.current.error).toBeTruthy();
    expect(result.current.streaming).toBe(false);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
