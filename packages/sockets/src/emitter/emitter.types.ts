import { ExtractRouteParams, NegativeTypes, TypeWithDefaults } from "@hyper-fetch/core";

import { SocketAdapterInstance } from "adapter";
import { Emitter } from "emitter";
import {
  ExtractEmitterAdapterType,
  ExtractEmitterHasDataType,
  ExtractEmitterHasParamsType,
  ExtractEmitterTopicType,
  ExtractEmitterPayloadType,
  EventReturnType,
  ExtractAdapterEmitterOptionsType,
  ExtractEmitterResponseType,
} from "types";

export type EmitterInstance = Emitter<any, any, any, any, any, any>;

export type EmitterOptionsType<Topic extends string, AdapterType extends SocketAdapterInstance> = {
  topic: Topic;
  timeout?: number;
  options?: ExtractAdapterEmitterOptionsType<AdapterType>;
};

export type EmitterEmitOptionsType<Emitter extends EmitterInstance> = EmitDataType<
  ExtractEmitterPayloadType<Emitter>,
  ExtractEmitterHasParamsType<Emitter>
> &
  EmitParamsType<ExtractRouteParams<ExtractEmitterTopicType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
  EmitRestType<Emitter>;

export type EmitterCallbackResponseType<EmitterType extends EmitterInstance> = (
  response: EventReturnType<ExtractEmitterResponseType<EmitterType>, ExtractEmitterAdapterType<EmitterType>>,
  emitter: EmitterType,
) => void;

export type EmitterCallbackErrorType<EmitterType extends EmitterInstance> = (
  error: Error,
  emitter: EmitterType,
) => void;

export type EmitterCallbackStartType<EmitterType extends EmitterInstance> = (emitter: EmitterType) => void;

// Emit

export type EmitDataType<Payload, HasData extends boolean> = HasData extends false
  ? {
      data: Payload;
    }
  : { data?: never };

export type EmitParamsType<Params, HasData extends boolean> = HasData extends false
  ? Params extends NegativeTypes | never | void
    ? { params?: never }
    : {
        params: Params;
      }
  : { params?: never };

export type EmitRestType<Emitter extends EmitterInstance> = {
  options?: Partial<EmitterOptionsType<ExtractEmitterTopicType<Emitter>, ExtractEmitterAdapterType<Emitter>>>;
  onEventStart?: EmitterCallbackStartType<Emitter>;
  onEvent?: EmitterCallbackResponseType<Emitter>;
  onEventError?: EmitterCallbackErrorType<Emitter>;
};

export type UnMountFunction = VoidFunction;

export type EmitType<Emitter extends EmitterInstance> =
  ExtractEmitterHasDataType<Emitter> extends false
    ? (
        options: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
          EmitParamsType<ExtractRouteParams<ExtractEmitterTopicType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
          EmitRestType<Emitter>,
      ) => UnMountFunction
    : ExtractRouteParams<ExtractEmitterTopicType<Emitter>> extends NegativeTypes
      ? (
          options?: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
            EmitParamsType<ExtractRouteParams<ExtractEmitterTopicType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
            EmitRestType<Emitter>,
        ) => UnMountFunction
      : ExtractEmitterHasParamsType<Emitter> extends false
        ? (
            options: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
              EmitParamsType<
                ExtractRouteParams<ExtractEmitterTopicType<Emitter>>,
                ExtractEmitterHasParamsType<Emitter>
              > &
              EmitRestType<Emitter>,
          ) => UnMountFunction
        : (
            options?: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
              EmitParamsType<
                ExtractRouteParams<ExtractEmitterTopicType<Emitter>>,
                ExtractEmitterHasParamsType<Emitter>
              > &
              EmitRestType<Emitter>,
          ) => UnMountFunction;

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
  TypeWithDefaults<Properties, "response", ExtractEmitterResponseType<T>>,
  TypeWithDefaults<Properties, "topic", ExtractEmitterTopicType<T>>,
  TypeWithDefaults<Properties, "adapter", ExtractEmitterAdapterType<T>>,
  TypeWithDefaults<Properties, "hasData", ExtractEmitterHasDataType<T>>,
  TypeWithDefaults<Properties, "hasParams", ExtractEmitterHasParamsType<T>>
>;
