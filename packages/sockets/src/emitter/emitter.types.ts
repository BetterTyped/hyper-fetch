import { ExtractResponseType, ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core";

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
} from "types";

export type EmitterInstance = Emitter<any>;

export type EmitterOptionsType<topic extends string, AdapterType extends SocketAdapterInstance> = {
  topic: topic;
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
  response: EventReturnType<ExtractResponseType<EmitterType>, ExtractEmitterAdapterType<EmitterType>>,
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
