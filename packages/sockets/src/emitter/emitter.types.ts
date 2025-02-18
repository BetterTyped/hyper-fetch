import { ExtractRouteParams, EmptyTypes, TypeWithDefaults, ParamsType } from "@hyper-fetch/core";

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

export type EmitterInstance = Emitter<any, any, SocketInstance, any, any>;

export type EmitterConfigurationType<Payload, Params, Topic extends string, Socket extends SocketInstance> = {
  payload?: Payload;
  params?: Params;
} & Partial<EmitterOptionsType<Topic, ExtractSocketAdapterType<Socket>>>;

export type EmitterOptionsType<Topic extends string, AdapterType extends SocketAdapterInstance> = {
  topic: Topic;
  timeout?: number;
  adapterOptions?: ExtractAdapterEmitterOptionsType<AdapterType>;
};

export type EmitterCallbackErrorType<EmitterType extends EmitterInstance> = (
  error: Error,
  emitter: EmitterType,
) => void;

export type EmitterCallbackStartType<EmitterType extends EmitterInstance> = (emitter: EmitterType) => void;

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
  ExtractAdapterEmitterOptionsType<Adapter> extends Record<string, any>
    ? ExtractAdapterEmitterOptionsType<Adapter>
    : {};

export type EmitOptionsType<Emitter extends EmitterInstance> = EmitPayloadType<
  ExtractEmitterPayloadType<Emitter>,
  ExtractEmitterHasPayloadType<Emitter>
> &
  EmitParamsType<ExtractRouteParams<ExtractEmitterTopicType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
  EmitterRestParams<ExtractSocketAdapterType<ExtractEmitterSocketType<Emitter>>>;

export type EmitType<Emitter extends EmitterInstance> =
  ExtractEmitterHasPayloadType<Emitter> extends false
    ? (options: EmitOptionsType<Emitter>) => void
    : ExtractRouteParams<ExtractEmitterTopicType<Emitter>> extends EmptyTypes
      ? (options?: EmitOptionsType<Emitter>) => void
      : ExtractEmitterHasParamsType<Emitter> extends false
        ? (options: EmitOptionsType<Emitter>) => void
        : (options?: EmitOptionsType<Emitter>) => void;

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
