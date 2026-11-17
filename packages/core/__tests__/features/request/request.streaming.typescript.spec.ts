import type { AdapterFetcherType } from "adapter";
import { Client } from "client";
import type { FetchAdapterOptionsType, HttpAdapterType } from "http-adapter";
import type { RequestResponseChunkEventType } from "managers";
import type { MockChunksType, MockerConfigType } from "mocker";
import { Plugin } from "plugin";
import type { PluginMethods } from "plugin";
import type { OptimisticCallbackResult, RequestHooks, RequestInstance, RequestSendActionsType } from "request";

const client = new Client({ url: "http://localhost:3000" });

const streamRequest = client
  .createRequest<{ response: { answer: string }; payload: { prompt: string }; error: { message: string } }>()({
    method: "POST",
    endpoint: "/chat/:chatId",
  })
  .setOptions({ streaming: true });

type StreamRequest = typeof streamRequest;

describe("Streaming [ Types ]", () => {
  describe("when the streaming adapter option is used", () => {
    it("should be an optional boolean of the fetch adapter options", () => {
      expectTypeOf<FetchAdapterOptionsType["streaming"]>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<FetchAdapterOptionsType>().toMatchTypeOf<{ streaming?: boolean; timeout?: number }>();
    });

    it("should be accepted by setOptions and by createRequest", () => {
      const request = client.createRequest<{ response: string }>()({
        endpoint: "/stream",
        options: { streaming: true },
      });

      expectTypeOf(request.setOptions).toBeCallableWith({ streaming: true });
      expectTypeOf(request.setOptions).toBeCallableWith({ streaming: false, timeout: 1000 });
      expectTypeOf(request.options).toEqualTypeOf<FetchAdapterOptionsType | undefined>();
      // @ts-expect-error streaming has to be a boolean
      request.setOptions({ streaming: "yes" });
    });

    it("should keep the declared response type as the resolved data", () => {
      type Resolved = Awaited<ReturnType<StreamRequest["send"]>>;

      expectTypeOf<Resolved["data"]>().toEqualTypeOf<{ answer: string } | null>();
      expectTypeOf<Resolved["status"]>().toEqualTypeOf<number | null>();
    });
  });

  describe("when the response chunk event is used", () => {
    it("should describe the chunk with bytes, text and counters", () => {
      type Event = RequestResponseChunkEventType<StreamRequest>;

      expectTypeOf<Event["chunk"]>().toEqualTypeOf<Uint8Array>();
      expectTypeOf<Event["text"]>().toEqualTypeOf<string>();
      expectTypeOf<Event["index"]>().toEqualTypeOf<number>();
      expectTypeOf<Event["loaded"]>().toEqualTypeOf<number>();
      expectTypeOf<Event["requestId"]>().toEqualTypeOf<string>();
      expectTypeOf<Event["request"]>().toEqualTypeOf<StreamRequest>();
      expectTypeOf<Event["mutationContext"]>().toEqualTypeOf<OptimisticCallbackResult<any> | undefined>();
    });

    it("should be the argument of the onResponseChunk send option", () => {
      type SendOptions = NonNullable<Parameters<StreamRequest["send"]>[0]>;
      type Callback = NonNullable<SendOptions["onResponseChunk"]>;

      expectTypeOf<Parameters<Callback>[0]>().toEqualTypeOf<RequestResponseChunkEventType<StreamRequest>>();
      expectTypeOf<ReturnType<Callback>>().toEqualTypeOf<void>();
      expectTypeOf<RequestSendActionsType<StreamRequest>["onResponseChunk"]>().toEqualTypeOf<
        ((eventData: RequestResponseChunkEventType<StreamRequest>) => void) | undefined
      >();
    });

    it("should type the fields inside the send option callback", () => {
      const options: Parameters<StreamRequest["send"]>[0] = {
        payload: { prompt: "hi" },
        params: { chatId: 1 },
        onResponseChunk: ({ chunk, text, index, loaded, request, requestId }) => {
          expectTypeOf(chunk).toEqualTypeOf<Uint8Array>();
          expectTypeOf(text).toBeString();
          expectTypeOf(index).toBeNumber();
          expectTypeOf(loaded).toBeNumber();
          expectTypeOf(requestId).toBeString();
          expectTypeOf(request.endpoint).toEqualTypeOf<"/chat/:chatId">();
        },
      };

      expect(options).toBeDefined();
    });
  });

  describe("when the request hooks are used", () => {
    it("should subscribe with the chunk event and return an unsubscribe function", () => {
      expectTypeOf(streamRequest.$hooks.onResponseChunk).toBeFunction();
      expectTypeOf<RequestHooks<StreamRequest>["onResponseChunk"]>().toEqualTypeOf<
        (cb: (eventData: RequestResponseChunkEventType<StreamRequest>) => void) => () => void
      >();
      expectTypeOf(streamRequest.$hooks.onResponseChunk).returns.toEqualTypeOf<() => void>();
    });
  });

  describe("when the request manager events are used", () => {
    const { events } = client.requestManager;

    it("should listen to every chunk", () => {
      expectTypeOf(events.onResponseChunk).returns.toEqualTypeOf<VoidFunction>();
      expectTypeOf(events.onResponseChunk<StreamRequest>)
        .parameter(0)
        .toEqualTypeOf<(data: RequestResponseChunkEventType<StreamRequest>) => void>();
      expectTypeOf(events.onResponseChunk)
        .parameter(0)
        .parameter(0)
        .toEqualTypeOf<RequestResponseChunkEventType<RequestInstance>>();
    });

    it("should listen to the chunks of a queue", () => {
      expectTypeOf(events.onResponseChunkByQueue).parameter(0).toBeString();
      expectTypeOf(events.onResponseChunkByQueue<StreamRequest>)
        .parameter(1)
        .toEqualTypeOf<(data: RequestResponseChunkEventType<StreamRequest>) => void>();
      expectTypeOf(events.onResponseChunkByQueue).returns.toEqualTypeOf<VoidFunction>();
    });

    it("should listen to the chunks of a request id", () => {
      expectTypeOf(events.onResponseChunkById).parameter(0).toBeString();
      expectTypeOf(events.onResponseChunkById<StreamRequest>)
        .parameter(1)
        .toEqualTypeOf<(data: RequestResponseChunkEventType<StreamRequest>) => void>();
      expectTypeOf(events.onResponseChunkById).returns.toEqualTypeOf<VoidFunction>();
    });

    it("should emit a chunk event", () => {
      expectTypeOf(events.emitResponseChunk)
        .parameter(0)
        .toEqualTypeOf<RequestResponseChunkEventType<RequestInstance>>();
      expectTypeOf(events.emitResponseChunk).returns.toEqualTypeOf<void>();
    });
  });

  describe("when a plugin is used", () => {
    it("should receive the chunk in the onResponseChunk method", () => {
      type Method = NonNullable<PluginMethods<typeof client>["onResponseChunk"]>;
      type Data = Parameters<Method>[0];

      expectTypeOf<Data["chunk"]>().toEqualTypeOf<Uint8Array>();
      expectTypeOf<Data["text"]>().toEqualTypeOf<string>();
      expectTypeOf<Data["index"]>().toEqualTypeOf<number>();
      expectTypeOf<Data["loaded"]>().toEqualTypeOf<number>();
      expectTypeOf<Data["requestId"]>().toEqualTypeOf<string>();
      expectTypeOf<Data>().toHaveProperty("request");
      expectTypeOf<ReturnType<Method>>().toEqualTypeOf<void>();
    });

    it("should be chainable with the other plugin methods", () => {
      const plugin = new Plugin({ name: "types" });

      expectTypeOf(plugin.onResponseChunk).returns.toEqualTypeOf<typeof plugin>();
      expectTypeOf(plugin.onResponseChunk(() => {}).onRequestSuccess).toBeFunction();
      expectTypeOf(plugin.onResponseChunk).toBeCallableWith(({ text, index }) => `${index}:${text}`);
    });
  });

  describe("when an adapter reports chunks", () => {
    it("should accept bytes or text and return a timestamp", () => {
      type Bindings = Parameters<AdapterFetcherType<HttpAdapterType>>[0];

      expectTypeOf<Bindings["onResponseChunk"]>().toEqualTypeOf<(value: Uint8Array | string) => number>();
    });
  });

  describe("when the mocker is used", () => {
    it("should accept text and byte chunks", () => {
      expectTypeOf<MockChunksType>().toEqualTypeOf<(string | Uint8Array)[]>();
      expectTypeOf<MockerConfigType["chunkTime"]>().toEqualTypeOf<number | undefined>();
    });

    it("should accept chunks without data, with data and with an error", () => {
      type MockResult = Awaited<ReturnType<Parameters<StreamRequest["setMock"]>[0]>>;

      expectTypeOf<{ chunks: string[]; status: 200 }>().toMatchTypeOf<MockResult>();
      expectTypeOf<{ chunks: Uint8Array[]; data: { answer: string }; status: 200 }>().toMatchTypeOf<MockResult>();
      expectTypeOf<{
        chunks: string[];
        error: { message: string };
        status: 500;
        success: false;
      }>().toMatchTypeOf<MockResult>();
      expectTypeOf<{ data: { answer: string }; status: 200 }>().toMatchTypeOf<MockResult>();
      expectTypeOf<{ chunks: number[]; status: 200 }>().not.toMatchTypeOf<MockResult>();
      expectTypeOf<{ status: 200 }>().not.toMatchTypeOf<MockResult>();
    });

    it("should accept the chunk delay in the mock config", () => {
      expectTypeOf(streamRequest.setMock).parameter(1).toEqualTypeOf<MockerConfigType | undefined>();
      expectTypeOf(streamRequest.setMock).toBeCallableWith(() => ({ chunks: ["a"], status: 200 }), { chunkTime: 10 });
    });
  });
});
