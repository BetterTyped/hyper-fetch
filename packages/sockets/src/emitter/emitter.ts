import { Time, ExtractRouteParams, ParamsType, PayloadMapperType } from "@hyper-fetch/core";

import { Socket } from "socket";
import { emitEvent, EmitterEmitOptionsType, EmitterOptionsType, EmitType } from "emitter";
import { ExtractAdapterEmitterOptionsType, ExtractSocketAdapterType } from "types";
import { SocketAdapterInstance } from "adapter";

export class Emitter<
  Payload,
  Endpoint extends string,
  Adapter extends SocketAdapterInstance,
  HasPayload extends boolean = false,
  HasParams extends boolean = false,
> {
  readonly topic: Endpoint;
  params?: ParamsType;
  timeout: number;
  data: Payload | undefined;
  options: ExtractAdapterEmitterOptionsType<ExtractSocketAdapterType<Socket>> | undefined;
  dataMapper?: PayloadMapperType<any>;

  constructor(
    readonly socket: Socket<Adapter>,
    readonly emitterOptions: EmitterOptionsType<Endpoint, ExtractSocketAdapterType<Socket>>,
    json?: Partial<Emitter<Payload, Endpoint, Adapter>>,
  ) {
    const { topic, timeout = Time.SEC * 2, options } = emitterOptions;

    this.topic = json?.topic ?? topic;
    this.data = json?.data;
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

  setData = <D extends Payload>(data: D) => {
    return this.clone<D, D extends null ? false : true, HasParams>({
      data,
    });
  };

  setDataMapper = <DataMapper extends (data: Payload) => any | Promise<any>>(dataMapper: DataMapper) => {
    const cloned = this.clone<Payload, HasPayload, HasParams>(undefined);

    cloned.dataMapper = dataMapper;

    return cloned;
  };

  setParams(params: NonNullable<ExtractRouteParams<Endpoint>>) {
    return this.clone<Payload, HasPayload, true>({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): Endpoint => {
    let topic = this.emitterOptions.topic as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        topic = topic.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return topic as Endpoint;
  };

  clone<
    NewPayload extends Payload = Payload,
    NewHasPayload extends boolean = HasPayload,
    NewHasParams extends boolean = HasParams,
  >(
    options?: Partial<EmitterOptionsType<Endpoint, Adapter>> & {
      params?: ParamsType;
      data?: NewPayload;
    },
  ): Emitter<NewPayload, Endpoint, Adapter, NewHasPayload, NewHasParams> {
    const json: Partial<Emitter<NewPayload, Endpoint, Adapter, NewHasPayload, NewHasParams>> = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as NewPayload,
      params: options?.params || this.params,
      ...options,
      topic: this.paramsMapper(options?.params || this.params),
    };

    const newInstance = new Emitter<NewPayload, Endpoint, Adapter, NewHasPayload, NewHasParams>(
      this.socket,
      this.emitterOptions,
      json,
    );

    newInstance.dataMapper = this.dataMapper;

    return newInstance;
  }

  emit: EmitType<this> = (options = {}) => {
    const typedOptions = options as EmitterEmitOptionsType<this>;
    // TODO: fix this type
    const instance = this.clone(typedOptions as any);
    emitEvent(instance);
  };
}
