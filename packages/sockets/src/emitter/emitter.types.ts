import { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core";

import { SocketAdapterInstance, ExtractEmitterOptionsType, ExtractSocketExtraType } from "adapter";
import { Emitter } from "emitter";
import {
  ExtractEmitterAdapterType,
  ExtractEmitterHasDataType,
  ExtractEmitterHasParamsType,
  ExtractEmitterNameType,
  ExtractEmitterPayloadType,
} from "types";

export type EmitterInstance = Emitter<any, any, any, SocketAdapterInstance, any, any, any>;

export type EmitterOptionsType<Name extends string, AdapterType extends SocketAdapterInstance> = {
  name: Name;
  timeout?: number;
  options?: ExtractEmitterOptionsType<AdapterType>;
};

export type EmitterAcknowledgeType<Response, AdapterType extends SocketAdapterInstance> = (
  error: Error | null,
  response: { data: Response; extra: ExtractSocketExtraType<AdapterType> },
) => void;

// Emit

export type EmitDataType<Payload, HasData extends boolean> = HasData extends false
  ? {
      data: Payload;
    }
  : { data?: never };

export type EmitParamsType<Params, HasData extends boolean> = HasData extends false
  ? Params extends NegativeTypes
    ? { params?: never }
    : {
        params: Params;
      }
  : { params?: never };

export type EmitRestType<Emitter extends EmitterInstance> = {
  options?: Partial<EmitterOptionsType<ExtractEmitterNameType<Emitter>, ExtractEmitterAdapterType<Emitter>>>;
  ack?: EmitterAcknowledgeType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterAdapterType<Emitter>>;
};

export type EmitType<Emitter extends EmitterInstance> = ExtractEmitterHasDataType<Emitter> extends false
  ? (
      options: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
        EmitParamsType<ExtractRouteParams<ExtractEmitterNameType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
        EmitRestType<Emitter>,
    ) => string
  : ExtractRouteParams<ExtractEmitterNameType<Emitter>> extends NegativeTypes
  ? (
      options?: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
        EmitParamsType<ExtractRouteParams<ExtractEmitterNameType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
        EmitRestType<Emitter>,
    ) => string
  : ExtractEmitterHasParamsType<Emitter> extends false
  ? (
      options: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
        EmitParamsType<ExtractRouteParams<ExtractEmitterNameType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
        EmitRestType<Emitter>,
    ) => string
  : (
      options?: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
        EmitParamsType<ExtractRouteParams<ExtractEmitterNameType<Emitter>>, ExtractEmitterHasParamsType<Emitter>> &
        EmitRestType<Emitter>,
    ) => string;
