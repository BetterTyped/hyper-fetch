import { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core";

import { SocketAdapterInstance } from "adapter";
import { Emitter } from "emitter";
import {
  ExtractEmitterAdapterType,
  ExtractEmitterHasDataType,
  ExtractEmitterHasParamsType,
  ExtractEmitterEndpointType,
  ExtractEmitterPayloadType,
  ExtractEmitterOptionsType,
  ExtractSocketExtraType,
} from "types";

export type EmitterInstance = Emitter<any>;

export type EmitterOptionsType<Endpoint extends string, AdapterType extends SocketAdapterInstance> = {
  endpoint: Endpoint;
  timeout?: number;
  options?: ExtractEmitterOptionsType<AdapterType>;
};

export type EmitterAcknowledgeType<Response, AdapterType extends SocketAdapterInstance> = (
  response:
    | { error: Error; data: null; extra: null }
    | { error: null; data: Response; extra: ExtractSocketExtraType<AdapterType> },
) => void;

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
  options?: Partial<EmitterOptionsType<ExtractEmitterEndpointType<Emitter>, ExtractEmitterAdapterType<Emitter>>>;
  ack?: EmitterAcknowledgeType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterAdapterType<Emitter>>;
};

export type EmitType<Emitter extends EmitterInstance> =
  ExtractEmitterHasDataType<Emitter> extends false
    ? (
        options: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
          EmitParamsType<
            ExtractRouteParams<ExtractEmitterEndpointType<Emitter>>,
            ExtractEmitterHasParamsType<Emitter>
          > &
          EmitRestType<Emitter>,
      ) => string
    : ExtractRouteParams<ExtractEmitterEndpointType<Emitter>> extends NegativeTypes
      ? (
          options?: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
            EmitParamsType<
              ExtractRouteParams<ExtractEmitterEndpointType<Emitter>>,
              ExtractEmitterHasParamsType<Emitter>
            > &
            EmitRestType<Emitter>,
        ) => string
      : ExtractEmitterHasParamsType<Emitter> extends false
        ? (
            options: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
              EmitParamsType<
                ExtractRouteParams<ExtractEmitterEndpointType<Emitter>>,
                ExtractEmitterHasParamsType<Emitter>
              > &
              EmitRestType<Emitter>,
          ) => string
        : (
            options?: EmitDataType<ExtractEmitterPayloadType<Emitter>, ExtractEmitterHasParamsType<Emitter>> &
              EmitParamsType<
                ExtractRouteParams<ExtractEmitterEndpointType<Emitter>>,
                ExtractEmitterHasParamsType<Emitter>
              > &
              EmitRestType<Emitter>,
          ) => string;
