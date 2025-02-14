import { Time, ExtractRouteParams, ParamsType, PayloadMapperType } from "@hyper-fetch/core";

import { Socket } from "socket";
import { emitEvent, EmitterEmitOptionsType, EmitterOptionsType, EmitType } from "emitter";
import { ExtractAdapterEmitterOptionsType, ExtractSocketAdapterType } from "types";
import { SocketAdapterInstance } from "adapter";

export class Emitter<
  Payload,
  Topic extends string,
  Adapter extends SocketAdapterInstance,
  HasPayload extends boolean = false,
  HasParams extends boolean = false,
> {
  readonly topic: Topic;
  params?: ParamsType;
  timeout: number;
  payload: Payload | undefined;
  options: ExtractAdapterEmitterOptionsType<ExtractSocketAdapterType<Socket>> | undefined;
  payloadMapper?: PayloadMapperType<any>;

  constructor(
    readonly socket: Socket<Adapter>,
    readonly emitterOptions: EmitterOptionsType<Topic, ExtractSocketAdapterType<Socket>>,
    json?: Partial<Emitter<Payload, Topic, Adapter>>,
  ) {
    const { topic, timeout = Time.SEC * 2, options } = emitterOptions;

    this.topic = json?.topic ?? topic;
    this.payload = json?.payload;
    this.timeout = json?.timeout ?? timeout;
    this.options = json?.options ?? options;
    this.params = json?.params;
  }

  setOptions(options: ExtractAdapterEmitterOptionsType<ExtractSocketAdapterType<Socket>>) {
    return this.clone({ options });
  }

  setTimeout(timeout: number) {
    return this.clone({ timeout });
  }

  setPayload = <D extends Payload>(payload: D) => {
    return this.clone<D, D extends null ? false : true, HasParams>({
      payload,
    });
  };

  setPayloadMapper = <DataMapper extends (payload: Payload) => any | Promise<any>>(payloadMapper: DataMapper) => {
    const cloned = this.clone<Payload, HasPayload, HasParams>(undefined);

    cloned.payloadMapper = payloadMapper;

    return cloned;
  };

  setParams(params: NonNullable<ExtractRouteParams<Topic>>) {
    return this.clone<Payload, HasPayload, true>({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): Topic => {
    let topic = this.emitterOptions.topic as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        topic = topic.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return topic as Topic;
  };

  clone<
    NewPayload extends Payload = Payload,
    NewHasPayload extends boolean = HasPayload,
    NewHasParams extends boolean = HasParams,
  >(
    options?: Partial<EmitterOptionsType<Topic, Adapter>> & {
      params?: ParamsType;
      payload?: NewPayload;
    },
  ): Emitter<NewPayload, Topic, Adapter, NewHasPayload, NewHasParams> {
    const json: Partial<Emitter<NewPayload, Topic, Adapter, NewHasPayload, NewHasParams>> = {
      timeout: this.timeout,
      options: this.options,
      payload: this.payload as NewPayload,
      params: options?.params || this.params,
      ...options,
      topic: this.paramsMapper(options?.params || this.params),
    };

    const newInstance = new Emitter<NewPayload, Topic, Adapter, NewHasPayload, NewHasParams>(
      this.socket,
      this.emitterOptions,
      json,
    );

    newInstance.payloadMapper = this.payloadMapper;

    return newInstance;
  }

  emit: EmitType<this> = (options = {}) => {
    const typedOptions = options as EmitterEmitOptionsType<this>;
    // TODO: fix this type
    const instance = this.clone(typedOptions as any);

    emitEvent(instance);
  };
}
