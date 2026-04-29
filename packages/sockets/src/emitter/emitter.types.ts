/* eslint-disable @typescript-eslint/no-shadow */
import type { ExtractUrlParams, EmptyTypes, TypeWithDefaults, ParamsType } from "@hyper-fetch/core";

import type { SocketAdapterInstance } from "adapter";
import type { Emitter } from "emitter";
import type { SocketInstance } from "socket";
import type {
  ExtractEmitterSocketType,
  ExtractEmitterHasPayloadType,
  ExtractEmitterHasParamsType,
  ExtractEmitterTopicType,
  ExtractEmitterPayloadType,
  ExtractAdapterEmitterOptionsType,
  ExtractSocketAdapterType,
} from "types";

export type EmitterInstanceProperties = {
  payload?: any;
  topic?: string;
  socket?: SocketInstance;
  hasParams?: boolean;
  hasPayload?: boolean;
};

/**
 * The **constraint** form of an Emitter type. Mindset: "any Emitter that matches this partial shape".
 *
 * Use `EmitterInstance` when you are writing a **reusable abstraction** that accepts emitters
 * from the outside - generic helpers (`<T extends EmitterInstance>`), reusable UI components /
 * hooks, `sdk.$configure({...})` callbacks, mocking utilities, return types, etc.
 *
 * Unspecified generic parameters default to `any` **on purpose**: an omitted field means
 * "I do not care about that field, the caller picks anything". This is exactly what you want
 * for a constraint - any concrete `Emitter` satisfies it. Partial constraints work too:
 * `EmitterInstance<{ payload: { text: string } }>` accepts every emitter whose payload has a
 * `text` field, regardless of topic, params, etc.
 *
 * For describing a **single topic** inside a socket SDK schema, use {@link EmitterModel} instead.
 * `EmitterModel` uses safe non-`any` defaults (`undefined`, `string`, `false`) so omitted fields
 * stay strict instead of silently collapsing to `any`.
 *
 * @see {@link EmitterModel} - definition counterpart for SDK schema modeling.
 */
export type EmitterInstance<EmitterProperties extends EmitterInstanceProperties = {}> = Emitter<
  TypeWithDefaults<EmitterProperties, "payload", any>,
  TypeWithDefaults<EmitterProperties, "topic", any>,
  TypeWithDefaults<EmitterProperties, "socket", SocketInstance>,
  TypeWithDefaults<EmitterProperties, "hasPayload", any>,
  TypeWithDefaults<EmitterProperties, "hasParams", any>
>;

/**
 * The **definition** form of an Emitter type. Mindset: "**this** specific topic".
 *
 * Use `EmitterModel` when you are **defining** an emitter inside a socket SDK schema. Unlike
 * {@link EmitterInstance}, every unspecified field stays strict instead of falling back to
 * `any` - because in a definition, an omitted field means "**this topic carries no payload**",
 * not "anything goes". The type system will reject mismatches at the call site instead of
 * silently erasing them.
 *
 * The `socket` field is also injected automatically by `createSocketSdk(socket)` at the SDK
 * boundary, so you never need to repeat it inside schema declarations.
 *
 * ### Defaults for omitted fields
 *
 * | Field        | Default          | Why                                                              |
 * | ------------ | ---------------- | ---------------------------------------------------------------- |
 * | `payload`    | `undefined`      | "No payload declared." `.setData()` is required for typed bodies.|
 * | `topic`      | `string`         | Allows literal narrowing without erasure. Pass a string literal. |
 * | `socket`     | `SocketInstance` | Injected by `createSocketSdk(socket)`; do not set this manually. |
 * | `hasPayload` | `false`          | "Caller must call `.setData()`." Override only when bound.       |
 * | `hasParams`  | `false`          | "Caller must call `.setParams()`." Override only when bound.     |
 *
 * @example
 * ```ts
 * // Schema describes shape only - socket is injected by createSocketSdk(socket).
 * type ChatSchema = {
 *   chat: {
 *     messages: {
 *       $emitter: EmitterModel<{
 *         payload: { text: string };
 *         topic: "chat/messages";
 *       }>;
 *     };
 *   };
 * };
 * ```
 *
 * @see {@link EmitterInstance} - constraint counterpart for accepting any Emitter.
 */
export type EmitterModel<EmitterProperties extends EmitterInstanceProperties = {}> = Emitter<
  TypeWithDefaults<EmitterProperties, "payload", undefined>,
  TypeWithDefaults<EmitterProperties, "topic", string>,
  TypeWithDefaults<EmitterProperties, "socket", SocketInstance>,
  TypeWithDefaults<EmitterProperties, "hasPayload", false>,
  TypeWithDefaults<EmitterProperties, "hasParams", false>
>;

export type EmitterCloneOptionsType<Payload, Params, Topic extends string, Socket extends SocketInstance> = {
  payload?: Payload;
  params?: Params | null;
} & Partial<EmitterOptionsType<Topic, ExtractSocketAdapterType<Socket>>>;

/** Configuration options for creating an Emitter instance. */
export type EmitterOptionsType<Topic extends string, AdapterType extends SocketAdapterInstance> = {
  /** The topic/channel name to emit messages on */
  topic: Topic;
  /** Adapter-specific emit options */
  options?: ExtractAdapterEmitterOptionsType<AdapterType>;
};

export type EmitterCallbackErrorType = (data: { error: Error }) => void;

// Emit

export type EmitPayloadType<Payload, HasPayload extends boolean> = HasPayload extends false
  ? {
      payload: Payload;
    }
  : { payload?: Payload };

export type EmitParamsType<
  Params extends ParamsType | EmptyTypes,
  HasPayload extends boolean,
> = HasPayload extends false
  ? Params extends EmptyTypes
    ? { params?: Params }
    : {
        params: Params;
      }
  : { params?: Params };

export type EmitterRestParams<Adapter extends SocketAdapterInstance> =
  ExtractAdapterEmitterOptionsType<Adapter> extends any
    ? {}
    : ExtractAdapterEmitterOptionsType<Adapter> extends Record<string, any>
      ? { options?: ExtractAdapterEmitterOptionsType<Adapter> }
      : {};

export type EmitMethodOptionsType<Emitter extends EmitterInstance> = EmitPayloadType<
  ExtractEmitterPayloadType<Emitter>,
  ExtractEmitterHasPayloadType<Emitter>
> &
  EmitParamsType<ExtractUrlParams<ExtractEmitterTopicType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
  EmitterRestParams<ExtractSocketAdapterType<ExtractEmitterSocketType<Emitter>>>;

export type EmitType<Emitter extends EmitterInstance> =
  ExtractEmitterHasPayloadType<Emitter> extends false
    ? (options: EmitMethodOptionsType<Emitter>) => void
    : ExtractUrlParams<ExtractEmitterTopicType<Emitter>> extends EmptyTypes
      ? (options?: EmitMethodOptionsType<Emitter>) => void
      : ExtractEmitterHasParamsType<Emitter> extends false
        ? (options: EmitMethodOptionsType<Emitter>) => void
        : (options?: EmitMethodOptionsType<Emitter>) => void;

export type ExtendEmitter<
  T extends EmitterInstance,
  Properties extends {
    payload?: any;
    response?: any;
    topic?: string;
    socket?: SocketInstance;
    mappedData?: any;
    hasData?: true | false;
    hasParams?: true | false;
  },
> = Emitter<
  TypeWithDefaults<Properties, "payload", ExtractEmitterPayloadType<T>>,
  Properties["topic"] extends string ? Properties["topic"] : ExtractEmitterTopicType<T>,
  Properties["socket"] extends SocketInstance ? Properties["socket"] : ExtractEmitterSocketType<T>,
  Properties["hasData"] extends true ? true : ExtractEmitterHasPayloadType<T>,
  Properties["hasParams"] extends true ? true : ExtractEmitterHasParamsType<T>
>;
