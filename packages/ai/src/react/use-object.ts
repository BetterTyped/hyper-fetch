import type { ExtractPayloadType, RequestInstance } from "@hyper-fetch/core";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import type { ObjectStreamOptionsType, ObjectStreamSnapshotType } from "../object/object-stream";
import { ObjectStream } from "../object/object-stream";
import type { InferSchemaOutput, StandardSchemaV1 } from "../schema/standard-schema.types";

export type UseObjectOptionsType<Schema extends StandardSchemaV1, R extends RequestInstance> = Omit<
  ObjectStreamOptionsType<InferSchemaOutput<Schema>, R>,
  "schema"
> & {
  schema: Schema;
};

/** Input of `submit`: the request payload type when the request declares one. */
export type UseObjectInputType<R extends RequestInstance> =
  unknown extends ExtractPayloadType<R>
    ? unknown
    : [ExtractPayloadType<R>] extends [undefined | void]
      ? unknown
      : ExtractPayloadType<R>;

export type UseObjectReturnType<Schema extends StandardSchemaV1, R extends RequestInstance> = ObjectStreamSnapshotType<
  InferSchemaOutput<Schema>,
  R
> & {
  submit: (input: UseObjectInputType<R>) => Promise<void>;
  stop: () => void;
  clear: () => void;
  isLoading: boolean;
};

/**
 * Stream a structured object and render it while it is generated. The object type comes from the schema, the input
 * type from the request payload.
 */
export const useObject = <Schema extends StandardSchemaV1, R extends RequestInstance = RequestInstance>(
  options: UseObjectOptionsType<Schema, R>,
): UseObjectReturnType<Schema, R> => {
  // The schema's output type is the object type - same options, just viewed through the inferred output
  const streamOptions = options as unknown as ObjectStreamOptionsType<InferSchemaOutput<Schema>, R>;
  const streamRef = useRef<ObjectStream<InferSchemaOutput<Schema>, R> | null>(null);
  if (!streamRef.current) {
    streamRef.current = new ObjectStream<InferSchemaOutput<Schema>, R>(streamOptions);
  }
  const stream = streamRef.current;
  stream.setOptions(streamOptions);

  const snapshot = useSyncExternalStore(stream.subscribe, stream.getSnapshot, stream.getSnapshot);

  useEffect(() => {
    return () => stream.stop();
  }, [stream]);

  const submit = useCallback((input: UseObjectInputType<R>) => stream.submit(input), [stream]);

  return {
    ...snapshot,
    submit,
    stop: stream.stop,
    clear: stream.clear,
    isLoading: snapshot.status === "submitted" || snapshot.status === "streaming",
  };
};
