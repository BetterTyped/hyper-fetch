import { AbortError } from "adapter";
import type { RequestResponseChunkEventType } from "managers";
import { Plugin } from "plugin";
import type { RequestInstance } from "request";

import { createChunkRecorder, createControlledClient, hex } from "../../utils/streaming.utils";

const encode = (value: string) => new TextEncoder().encode(value);
const decodeAll = (bytes: number[] | Uint8Array) => new TextDecoder().decode(Uint8Array.from(bytes));

/** Deterministic pseudo-random numbers, so the generated cases are the same on every run. */
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
};

/** Random split positions in ascending order (repeated positions produce empty pieces). */
const randomPositions = (random: () => number, count: number, length: number) => {
  const positions: number[] = [];
  let position = 0;
  for (let index = 0; index < count; index += 1) {
    position += Math.floor(random() * (length - position + 1));
    positions.push(position);
  }
  return positions;
};

/** Split bytes into pieces at the given positions. */
const splitAt = (bytes: Uint8Array, positions: number[]) => {
  const parts: Uint8Array[] = [];
  let start = 0;
  [...positions, bytes.length].forEach((position) => {
    parts.push(bytes.slice(start, position));
    start = position;
  });
  return parts;
};

describe("Adapter [ Bindings ] [ Response chunks ]", () => {
  const setup = async () => {
    const { client, next } = createControlledClient();
    const request = client.createRequest<{ response: unknown }>()({ endpoint: "/stream", method: "POST" });
    const recorder = createChunkRecorder();
    const response = request.send({ onResponseChunk: recorder.record });
    const call = await next();
    call.open();
    return { client, request, recorder, response, call };
  };

  /** Stream the given parts through the bindings and return what the listeners received. */
  const stream = async (parts: (Uint8Array | string)[]) => {
    const { recorder, response, call } = await setup();
    parts.forEach((part) => call.chunk(part));
    call.succeed("done");
    await response;
    return recorder;
  };

  describe("when a chunk is reported", () => {
    it("should emit string chunks as UTF-8 bytes with the same text", async () => {
      const recorder = await stream(["zażółć 🚀"]);

      expect(recorder.chunks).toHaveLength(1);
      expect(recorder.chunks[0].text).toBe("zażółć 🚀");
      expect(recorder.chunks[0].bytes).toEqual([...encode("zażółć 🚀")]);
    });

    it("should emit byte chunks untouched with their decoded text", async () => {
      const bytes = encode("hello");
      const { client, call, response } = await setup();
      const received: Uint8Array[] = [];
      const unmount = client.requestManager.events.onResponseChunk(({ chunk }) => received.push(chunk));

      call.chunk(bytes);
      call.succeed("done");
      await response;
      unmount();

      // The very same buffer is passed along - chunks are not copied
      expect(received[0]).toBe(bytes);
    });

    it("should count index from zero and loaded in bytes, not characters", async () => {
      const recorder = await stream(["a", "ż", "🚀", encode("€")]);

      expect(recorder.chunks.map(({ index }) => index)).toEqual([0, 1, 2, 3]);
      expect(recorder.chunks.map(({ loaded }) => loaded)).toEqual([1, 3, 7, 10]);
    });

    it("should return a timestamp", async () => {
      const { call, response } = await setup();
      const before = Date.now();

      const timestamp = call.bindings.onResponseChunk("a");

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
      call.succeed("done");
      await response;
    });

    it("should mark the response as started when the adapter did not report the response start", async () => {
      const { client, next } = createControlledClient();
      const request = client.createRequest<{ response: unknown }>()({ endpoint: "/stream" });
      const response = request.send();
      const call = await next();

      expect(call.bindings.getResponseStartTimestamp()).toBeNull();
      call.chunk("a");
      expect(call.bindings.getResponseStartTimestamp()).toBeNumber();

      call.succeed("done");
      await response;
    });

    it("should carry the request id and the request that is being sent", async () => {
      const { client, request, call, response } = await setup();
      const events: RequestResponseChunkEventType<RequestInstance>[] = [];
      const unmount = client.requestManager.events.onResponseChunk((event) => events.push(event));

      call.chunk("a");
      call.succeed("done");
      await response;
      unmount();

      expect(events[0].requestId).toBe(call.requestId);
      expect(events[0].request.endpoint).toBe(request.endpoint);
      expect(events[0].request.queryKey).toBe(request.queryKey);
    });

    it("should notify the request manager before the plugins", async () => {
      const order: string[] = [];
      const { client, next } = createControlledClient();
      client.addPlugin(new Plugin({ name: "order" }).onResponseChunk(({ text }) => order.push(`plugin:${text}`)));
      const request = client.createRequest<{ response: unknown }>()({ endpoint: "/stream" });
      client.requestManager.events.onResponseChunk(({ text }) => order.push(`global:${text}`));
      client.requestManager.events.onResponseChunkByQueue(request.queryKey, ({ text }) => order.push(`queue:${text}`));
      const response = request.send({ onResponseChunk: ({ text }) => order.push(`id:${text}`) });
      const call = await next();

      call.chunk("a");
      call.chunk("b");
      call.succeed("done");
      await response;

      expect(order).toEqual(["global:a", "id:a", "queue:a", "plugin:a", "global:b", "id:b", "queue:b", "plugin:b"]);
    });

    it("should give plugins the same payload as the request manager events", async () => {
      const fromPlugin: unknown[] = [];
      const fromManager: unknown[] = [];
      const { client, next } = createControlledClient();
      client.addPlugin(new Plugin({ name: "payload" }).onResponseChunk((event) => fromPlugin.push(event)));
      client.requestManager.events.onResponseChunk((event) => fromManager.push(event));
      const response = client.createRequest<{ response: unknown }>()({ endpoint: "/stream" }).send();
      const call = await next();

      call.chunk("a");
      call.chunk(encode("b"));
      call.succeed("done");
      await response;

      expect(fromPlugin).toHaveLength(2);
      expect(fromPlugin).toEqual(fromManager);
    });

    it("should restart the counters for every request", async () => {
      const first = await stream(["a", "b"]);
      const second = await stream(["c"]);

      expect(first.chunks.map(({ index, loaded }) => [index, loaded])).toEqual([
        [0, 1],
        [1, 2],
      ]);
      expect(second.chunks.map(({ index, loaded }) => [index, loaded])).toEqual([[0, 1]]);
    });
  });

  describe("when multi-byte characters are split across chunks", () => {
    const samples = [
      ["2-byte characters", "zażółć gęślą jaźń"],
      ["3-byte characters", "€uro ✓ 日本語"],
      ["4-byte characters", "🚀🎉 rocket 𝄞"],
      ["joined emoji sequences", "👨‍👩‍👧‍👦 family 🏳️‍🌈 flag 👍🏽"],
      ["combining marks", "é ñ ǘ"],
    ] as const;

    it.each(samples)("should decode %s split at every byte position", async (_name, sample) => {
      const bytes = encode(sample);

      for (let position = 1; position < bytes.length; position += 1) {
        // eslint-disable-next-line no-await-in-loop
        const recorder = await stream(splitAt(bytes, [position]));

        expect(recorder.text()).toBe(sample);
        expect(recorder.bytes()).toEqual([...bytes]);
      }
    });

    it.each(samples)("should decode %s delivered one byte at a time", async (_name, sample) => {
      const bytes = encode(sample);
      const recorder = await stream([...bytes].map((byte) => Uint8Array.of(byte)));

      expect(recorder.text()).toBe(sample);
      expect(recorder.chunks).toHaveLength(bytes.length);
      expect(recorder.chunks.at(-1)?.loaded).toBe(bytes.length);
    });

    it("should hold back the text of an incomplete character until its last byte arrives", async () => {
      const rocket = encode("🚀");
      const recorder = await stream([rocket.slice(0, 1), rocket.slice(1, 3), rocket.slice(3)]);

      expect(recorder.chunks.map(({ text }) => text)).toEqual(["", "", "🚀"]);
      expect(recorder.chunks.map(({ loaded }) => loaded)).toEqual([1, 3, 4]);
    });

    it("should never emit a replacement character for valid text", async () => {
      const random = createRandom(7);
      const sample = "Zażółć 🚀 gęślą 日本語 👨‍👩‍👧‍👦 jaźń €".repeat(4);
      const bytes = encode(sample);

      for (let round = 0; round < 25; round += 1) {
        const positions = randomPositions(random, 12, bytes.length);
        // eslint-disable-next-line no-await-in-loop
        const recorder = await stream(splitAt(bytes, positions));

        expect(recorder.text()).toBe(sample);
        expect(recorder.text()).not.toContain("�");
      }
    });

    it("should keep surrogate pairs intact when string chunks split them", async () => {
      // The two UTF-16 code units of "🚀"
      const high = "\uD83D";
      const low = "\uDE80";
      const recorder = await stream([`a${high}`, `${low}b`]);

      expect(recorder.text()).toBe("a🚀b");
    });

    it("should strip the byte order mark the same way as decoding the whole body", async () => {
      const bytes = Uint8Array.of(...hex("ef bb bf"), ...encode("bom"));

      const whole = await stream([bytes]);
      const split = await stream(splitAt(bytes, [1, 2, 4]));

      expect(whole.text()).toBe(decodeAll(bytes));
      expect(split.text()).toBe(decodeAll(bytes));
      expect(split.text()).toBe("bom");
    });
  });

  describe("when the body is not valid UTF-8", () => {
    it("should flush the bytes of a character cut off at the end of the body", async () => {
      // "a" followed by the first two bytes of a four-byte emoji - the stream ended in the middle of it
      const bytes = hex("61 f0 9f");
      const recorder = await stream([bytes]);

      expect(recorder.text()).toBe(decodeAll(bytes));
      expect(recorder.text()).toBe("a�");
    });

    it("should emit the flushed tail as a last chunk without bytes", async () => {
      const recorder = await stream([hex("61"), hex("e2 82")]);

      expect(recorder.chunks).toEqual([
        { text: "a", bytes: [...hex("61")], index: 0, loaded: 1 },
        { text: "", bytes: [...hex("e2 82")], index: 1, loaded: 3 },
        { text: "�", bytes: [], index: 2, loaded: 3 },
      ]);
    });

    it("should send the flushed tail to every channel before the request resolves", async () => {
      const order: string[] = [];
      const { client, next } = createControlledClient();
      client.addPlugin(
        new Plugin({ name: "flush" })
          .onResponseChunk(({ text }) => order.push(`plugin:${text}`))
          .onRequestSuccess(() => order.push("success")),
      );
      const request = client.createRequest<{ response: unknown }>()({ endpoint: "/stream" });
      request.$hooks.onResponseChunk(({ text }) => order.push(`hook:${text}`));
      const response = request.send({
        onResponseChunk: ({ text }) => order.push(`send:${text}`),
        onResponse: () => order.push("response"),
      });
      const call = await next();

      call.chunk(hex("f0 9f"));
      call.succeed("done");
      await response;

      expect(order).toEqual(["send:", "hook:", "plugin:", "send:�", "hook:�", "plugin:�", "success", "response"]);
    });

    it("should not emit an extra chunk when the body ends on a complete character", async () => {
      const recorder = await stream([encode("zażółć"), encode("🚀")]);

      expect(recorder.chunks).toHaveLength(2);
    });

    it("should not emit an extra chunk when no chunk was reported", async () => {
      const recorder = await stream([]);

      expect(recorder.chunks).toHaveLength(0);
    });

    it("should not flush anything when the request fails before the body ended", async () => {
      const { recorder, response, call } = await setup();

      call.chunk(hex("61 f0 9f"));
      call.fail(new Error("dropped"), 0);
      await response;

      expect(recorder.chunks.map(({ text }) => text)).toEqual(["a"]);
    });

    it("should replace invalid bytes in the middle the same way as decoding the whole body", async () => {
      const bytes = hex("61 ff 62 c3 28 63 ed a0 80 64");

      for (let position = 1; position < bytes.length; position += 1) {
        // eslint-disable-next-line no-await-in-loop
        const recorder = await stream(splitAt(bytes, [position]));

        expect(recorder.text()).toBe(decodeAll(bytes));
      }
    });

    it("should always produce the same text as decoding the whole body for random bytes", async () => {
      const random = createRandom(42);

      for (let round = 0; round < 60; round += 1) {
        const bytes = Uint8Array.from({ length: 1 + Math.floor(random() * 48) }, () => Math.floor(random() * 256));
        const positions = randomPositions(random, Math.floor(random() * 6), bytes.length);
        // eslint-disable-next-line no-await-in-loop
        const recorder = await stream(splitAt(bytes, positions));

        expect(recorder.text()).toBe(decodeAll(bytes));
        expect(recorder.bytes()).toEqual([...bytes]);
      }
    });

    it("should keep the order of bytes and text when a string chunk follows an incomplete character", async () => {
      const recorder = await stream([hex("f0 9f"), "abc"]);

      expect(recorder.text()).toBe(decodeAll(recorder.bytes()));
      expect(recorder.text()).toBe("�abc");
    });
  });
  describe("when the request was aborted", () => {
    it("should ignore chunks the adapter reports after the abort", async () => {
      const { client, request, recorder, response, call } = await setup();
      const onPluginChunk = vi.fn();
      client.addPlugin(new Plugin({ name: "aborted" }).onResponseChunk(onPluginChunk));

      call.chunk("before");
      request.abort();
      call.chunk("after");
      call.chunk(encode("after"));
      const { error } = await response;

      expect(call.isAborted()).toBe(true);
      expect(error).toBeInstanceOf(AbortError);
      expect(recorder.text()).toBe("before");
      expect(onPluginChunk).toHaveBeenCalledTimes(1);
    });

    it("should not flush an unfinished character after the abort", async () => {
      const { client, request, response, call } = await setup();
      const texts: string[] = [];
      client.requestManager.events.onResponseChunk(({ text }) => texts.push(text));

      call.chunk(hex("61 f0 9f"));
      request.abort();
      call.bindings.onResponseEnd();
      await response;

      expect(texts).toEqual(["a"]);
    });

    it("should still return a timestamp for an ignored chunk", async () => {
      const { request, response, call } = await setup();

      request.abort();

      expect(call.bindings.onResponseChunk("ignored")).toBeNumber();
      await response;
    });
  });
});
