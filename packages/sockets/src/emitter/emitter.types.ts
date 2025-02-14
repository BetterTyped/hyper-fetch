import { ExtractRouteParams, EmptyTypes, TypeWithDefaults } from "@hyper-fetch/core";

import { SocketAdapterInstance } from "adapter";
import { Emitter } from "emitter";
import {
  ExtractEmitterAdapterType,
  ExtractEmitterHasPayloadType,
  ExtractEmitterHasParamsType,
  ExtractEmitterTopicType,
  ExtractEmitterPayloadType,
  ExtractAdapterEmitterOptionsType,
} from "types";

export type EmitterInstance = Emitter<any, any, any, any, any>;

export type EmitterOptionsType<Topic extends string, AdapterType extends SocketAdapterInstance> = {
  topic: Topic;
  timeout?: number;
  options?: ExtractAdapterEmitterOptionsType<AdapterType>;
};

export type EmitterEmitOptionsType<Emitter extends EmitterInstance> = EmitPayloadType<
  ExtractEmitterPayloadType<Emitter>,
  ExtractEmitterHasParamsType<Emitter>
> &
  EmitParamsType<ExtractRouteParams<ExtractEmitterTopicType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
  EmitRestType<Emitter>;

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
  : { payload?: never };

export type EmitParamsType<Params, HasPayload extends boolean> = HasPayload extends false
  ? Params extends EmptyTypes | never | void
    ? { params?: never }
    : {
        params: Params;
      }
  : { params?: never };

export type EmitRestType<Emitter extends EmitterInstance> = {
  options?: Partial<EmitterOptionsType<ExtractEmitterTopicType<Emitter>, ExtractEmitterAdapterType<Emitter>>>;
};

export type EmitOptionsType<Emitter extends EmitterInstance> = EmitPayloadType<
  ExtractEmitterPayloadType<Emitter>,
  ExtractEmitterHasPayloadType<Emitter>
> &
  EmitParamsType<ExtractRouteParams<ExtractEmitterTopicType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
  EmitRestType<Emitter>;

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
    adapter?: SocketAdapterInstance;
    mappedData?: any;
    hasData?: true | false;
    hasParams?: true | false;
  },
> = Emitter<
  TypeWithDefaults<Properties, "payload", ExtractEmitterPayloadType<T>>,
  Properties["topic"] extends string ? Properties["topic"] : ExtractEmitterTopicType<T>,
  Properties["adapter"] extends SocketAdapterInstance ? Properties["adapter"] : ExtractEmitterAdapterType<T>,
  Properties["hasData"] extends true ? true : ExtractEmitterHasPayloadType<T>,
  Properties["hasParams"] extends true ? true : ExtractEmitterHasParamsType<T>
>;
