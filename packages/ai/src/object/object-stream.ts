import type { ExtractErrorType, RequestInstance, StreamParserType } from "@hyper-fetch/core";

import type { SchemaValidationError } from "../schema/standard-schema";
import { validateSchema } from "../schema/standard-schema";
import type { StandardSchemaV1 } from "../schema/standard-schema.types";
import { generateId } from "../utils/id";
import { parsePartialJSON } from "../utils/partial-json";
import { cancelRequest } from "../utils/request";
import type { DeepPartial } from "../utils/types";
import { textObjectProtocol } from "./object.protocols";
import type { ObjectProtocolType } from "./object.types";

export type ObjectStreamStatusType = "ready" | "submitted" | "streaming" | "error";

export class ObjectStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObjectStreamError";
  }
}

export type ObjectStreamErrorType<R extends RequestInstance = RequestInstance> =
  | ExtractErrorType<R>
  | SchemaValidationError
  | ObjectStreamError
  | Error;

export type ObjectStreamOptionsType<Output, R extends RequestInstance> = {
  /** HyperFetch request that streams the object */
  request: R;
  /** Validates the final object; its output type is the object type */
  schema: StandardSchemaV1<unknown, Output>;
  /** Wire format, plain JSON text by default */
  protocol?: ObjectProtocolType;
  /** Object shown before anything is streamed */
  initialValue?: DeepPartial<Output>;
  onFinish?: (result: { object: Output | undefined; error: ObjectStreamErrorType<R> | undefined }) => void;
  onError?: (error: ObjectStreamErrorType<R>) => void;
};

export type ObjectStreamSnapshotType<Output, R extends RequestInstance> = {
  /** Partial object while streaming, the validated object once done */
  object: DeepPartial<Output> | undefined;
  /** Raw streamed text */
  text: string;
  status: ObjectStreamStatusType;
  error: ObjectStreamErrorType<R> | undefined;
};

const isEqual = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * Streams a structured object: partial JSON is parsed as it arrives and the final object is validated with the
 * schema. Framework-agnostic store behind `useObject`.
 */
export class ObjectStream<Output, R extends RequestInstance = RequestInstance> {
  private options: ObjectStreamOptionsType<Output, R>;
  private snapshot: ObjectStreamSnapshotType<Output, R>;
  private listeners = new Set<() => void>();
  private active: {
    runId: string;
    requestId: string | null;
    request: RequestInstance;
    aborted: boolean;
  } | null = null;
  /** The latest submit - an older one must not write its result over it */
  private latest: object | null = null;

  constructor(options: ObjectStreamOptionsType<Output, R>) {
    this.options = options;
    this.snapshot = { object: options.initialValue, text: "", status: "ready", error: undefined };
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  setOptions = (options: Partial<ObjectStreamOptionsType<Output, R>>) => {
    this.options = { ...this.options, ...options };
  };

  private update(patch: Partial<ObjectStreamSnapshotType<Output, R>>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  /** Abort the current request - also one that is still waiting for the network or for a retry. */
  stop = () => {
    const { active } = this;
    if (!active) {
      return;
    }
    active.aborted = true;
    if (active.requestId) {
      cancelRequest(active.request, active.requestId);
    }
  };

  clear = () => {
    this.stop();
    this.latest = null;
    this.update({ object: undefined, text: "", status: "ready", error: undefined });
  };

  /** Send the input and stream the object. A running stream is aborted first. */
  submit = async (input: unknown): Promise<void> => {
    this.stop();

    const protocol = this.options.protocol ?? textObjectProtocol();
    const runId = generateId();
    let text = "";
    // Holder object - assigned from the decoder callback, so control flow narrowing must not apply
    const received: { complete: { value: unknown } | null } = { complete: null };
    let streamError: ObjectStreamErrorType<R> | undefined;

    this.update({ object: undefined, text: "", status: "submitted", error: undefined });

    const active = {
      runId,
      requestId: null as string | null,
      request: this.options.request as RequestInstance,
      aborted: false,
    };
    this.active = active;
    this.latest = active;

    let decoder: StreamParserType | null = null;
    let responseError: unknown;
    let failed = false;

    try {
      const streamDecoder = protocol.createDecoder((event) => {
        if (this.active !== active || active.aborted) {
          return;
        }
        if (event.type === "text-delta") {
          text += event.delta;
          const { value, state } = parsePartialJSON<DeepPartial<Output>>(text);
          const patch: Partial<ObjectStreamSnapshotType<Output, R>> = { text, status: "streaming" };
          if ((state === "successful-parse" || state === "repaired-parse") && !isEqual(value, this.snapshot.object)) {
            patch.object = value;
          }
          this.update(patch);
        } else if (event.type === "object") {
          received.complete = { value: event.object };
        } else {
          streamError = new ObjectStreamError(event.errorText);
        }
      });
      decoder = streamDecoder;

      const prepared = protocol.prepareRequest(input, { runId });
      let request: RequestInstance = this.options.request;
      request = request.setOptions({ ...request.options, streaming: true });
      if (prepared.headers) {
        request = request.setHeaders({
          ...(request.headers as Record<string, string> | undefined),
          ...prepared.headers,
        });
      }
      active.request = request;

      let attempts = 0;
      const response = await request.send({
        payload: prepared.payload,
        onBeforeSent: ({ requestId }: { requestId: string }) => {
          active.requestId = requestId;
          // stop() called before the request id was known
          if (active.aborted) {
            cancelRequest(request, requestId);
          }
        },
        onRequestStart: () => {
          attempts += 1;
          streamDecoder.reset();
          if (attempts === 1 || this.active !== active || active.aborted) {
            return;
          }
          // Retried requests stream again from the beginning - drop everything the failed attempt produced
          text = "";
          received.complete = null;
          streamError = undefined;
          this.update({ object: undefined, text: "", status: "submitted" });
        },
        onResponseChunk: ({ text: chunk }: { text: string }) => {
          if (active.aborted) {
            return;
          }
          try {
            streamDecoder.feed(chunk);
          } catch (error) {
            streamError = error as Error;
            this.stop();
          }
        },
      } as never);
      responseError = response.error;
    } catch (error) {
      // Building or sending the request threw (e.g. `prepareBody`) - end with that error instead of staying busy
      failed = true;
      streamError = streamError ?? (error as Error);
    }

    if (this.active !== active) {
      // Superseded by another submit
      return;
    }

    // Flush while the run is still active - events of a finished run are ignored
    if (decoder && !failed && !active.aborted && !streamError && !responseError) {
      try {
        decoder.flush();
      } catch (error) {
        streamError = error as Error;
      }
    }
    this.active = null;

    if (active.aborted && !streamError) {
      this.update({ status: "ready" });
      this.options.onFinish?.({ object: undefined, error: undefined });
      return;
    }

    let error: ObjectStreamErrorType<R> | undefined =
      streamError ?? (responseError as ObjectStreamErrorType<R> | null) ?? undefined;
    let object: Output | undefined;

    if (!error) {
      const parsed = received.complete
        ? { value: received.complete.value, state: "successful-parse" as const }
        : parsePartialJSON(text);

      if (parsed.state !== "successful-parse") {
        error = new ObjectStreamError("The streamed text is not complete JSON");
      } else {
        try {
          const validation = await validateSchema(this.options.schema, parsed.value, "Streamed object");
          if (validation.success) {
            object = validation.value as Output;
          } else {
            error = validation.error;
          }
        } catch (validationError) {
          // A schema that throws instead of returning issues
          error = validationError as Error;
        }
        if (this.latest !== active) {
          // Submitted again or cleared while an async schema was validating
          return;
        }
      }
    }

    this.update({
      status: error ? "error" : "ready",
      error,
      ...(object !== undefined && { object: object as DeepPartial<Output> }),
    });

    if (error) {
      this.options.onError?.(error);
    }
    this.options.onFinish?.({ object, error });
  };
}
