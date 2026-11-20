import { act, renderHook, waitFor } from "@testing-library/react";
import { useStream } from "hooks/use-stream";
import { StrictMode } from "react";

import { client } from "../../utils";

/** A response body the test writes to chunk by chunk, which records when the reader cancels it */
const createControlledStream = () => {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
    },
    cancel() {
      handle.canceled = true;
    },
  });
  const handle = {
    stream,
    canceled: false,
    // Like a server, it can't write to a body the client already canceled
    push: (text: string) => !handle.canceled && controller?.enqueue(encoder.encode(text)),
    close: () => !handle.canceled && controller?.close(),
  };
  return handle;
};

/**
 * `abort()` and `reset()` have to stop a stream which is already being read - the request itself has finished at that
 * point (it resolved with the body), so aborting the request alone does nothing.
 */
describe("useStream [ Abort ]", () => {
  let streams: ReturnType<typeof createControlledStream>[] = [];
  let fetchSpy = vi.spyOn(globalThis, "fetch");

  const createStreamRequest = () =>
    client.createRequest<{ response: ReadableStream<Uint8Array> }>()({ endpoint: "/stream" });

  beforeEach(() => {
    client.clear();
    streams = [];
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      const controlled = createControlledStream();
      streams.push(controlled);
      return new Response(controlled.stream, { status: 200 });
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const startStream = async () => {
    const view = renderHook(() => useStream(createStreamRequest()));
    act(() => {
      view.result.current.start();
    });
    await waitFor(() => expect(streams).toHaveLength(1));
    await act(async () => {
      streams[0].push("first ");
    });
    await waitFor(() => expect(view.result.current.text).toBe("first "));
    return view;
  };

  it("should stop reading the stream on abort", async () => {
    const { result } = await startStream();

    act(() => {
      result.current.abort();
    });
    await act(async () => {
      streams[0].push("second");
      streams[0].close();
    });

    expect(streams[0].canceled).toBeTrue();
    expect(result.current).toMatchObject({ text: "first ", streaming: false, done: false });
  });

  it("should not let the previous stream write into the state after reset", async () => {
    const { result } = await startStream();

    act(() => {
      result.current.reset();
    });
    act(() => {
      result.current.start();
    });
    await waitFor(() => expect(streams).toHaveLength(2));
    await act(async () => {
      streams[0].push("old");
      streams[1].push("new");
    });

    await waitFor(() => expect(result.current.text).toBe("new"));
    expect(streams[0].canceled).toBeTrue();
    expect(result.current.chunks).toHaveLength(1);
  });

  it("should keep the auto-started stream running in StrictMode", async () => {
    const request = createStreamRequest();
    const { result } = renderHook(() => useStream(request, { autoStart: true }), { wrapper: StrictMode });

    await waitFor(() => expect(streams.length).toBeGreaterThan(0));
    await act(async () => {
      streams.at(-1)?.push("hello");
      streams.at(-1)?.close();
    });

    await waitFor(() => expect(result.current).toMatchObject({ text: "hello", done: true, streaming: false }));
  });

  it("should stop reading the stream on unmount", async () => {
    const { unmount } = await startStream();

    unmount();

    await waitFor(() => expect(streams[0].canceled).toBeTrue());
  });
});
