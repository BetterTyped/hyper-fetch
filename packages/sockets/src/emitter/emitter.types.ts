import { ExtractUrlParams, EmptyTypes, TypeWithDefaults, ParamsType } from "@hyper-fetch/core";

import { SocketAdapterInstance } from "adapter";
import { Emitter } from "emitter";
import { SocketInstance } from "socket";
import {
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

export type EmitterInstance<EmitterProperties extends EmitterInstanceProperties = {}> = Emitter<
  TypeWithDefaults<EmitterProperties, "payload", any>,
  TypeWithDefaults<EmitterProperties, "topic", any>,
  TypeWithDefaults<EmitterProperties, "socket", SocketInstance>,
  TypeWithDefaults<EmitterProperties, "hasPayload", any>,
  TypeWithDefaults<EmitterProperties, "hasParams", any>
>;

export type EmitterCloneOptionsType<Payload, Params, Topic extends string, Socket extends SocketInstance> = {
  payload?: Payload;
  params?: Params | null;
} & Partial<EmitterOptionsType<Topic, ExtractSocketAdapterType<Socket>>>;

export type EmitterOptionsType<Topic extends string, AdapterType extends SocketAdapterInstance> = {
  topic: Topic;
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
