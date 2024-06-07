import { Time, ExtractRouteParams, ParamsType, PayloadMapperType } from "@hyper-fetch/core";

import { Socket } from "socket";
import { emitEvent, EmitterEmitOptionsType, EmitterOptionsType, EmitType } from "emitter";
import { SocketAdapterInstance } from "adapter";
import { ExtractAdapterEmitterOptionsType } from "types";

export class Emitter<
  Payload,
  Response,
  Endpoint extends string,
  AdapterType extends SocketAdapterInstance,
  HasData extends boolean = false,
  HasParams extends boolean = false,
> {
  readonly topic: Endpoint;
  params?: ParamsType;
  timeout: number;
  data: Payload | null = null;
  options: ExtractAdapterEmitterOptionsType<AdapterType>;
  dataMapper?: PayloadMapperType<any>;

  constructor(
    readonly socket: Socket<AdapterType>,
    readonly emitterOptions: EmitterOptionsType<Endpoint, AdapterType>,
    json?: Partial<Emitter<Payload, Response, Endpoint, AdapterType>>,
  ) {
    const { topic, timeout = Time.SEC * 2, options } = emitterOptions;

    this.topic = json?.topic ?? topic;
    this.data = json?.data;
    this.timeout = json?.timeout ?? timeout;
    this.options = json?.options ?? options;
    this.params = json?.params;
  }

  setOptions(options: ExtractAdapterEmitterOptionsType<AdapterType>) {
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
    const cloned = this.clone<Payload, HasData, HasParams>(undefined);

    cloned.dataMapper = dataMapper;

    return cloned;
  };

  setParams(params: ExtractRouteParams<Endpoint>) {
    return this.clone<Payload, HasData, true>({ params });
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
    NewHasData extends boolean = HasData,
    NewHasParams extends boolean = HasParams,
  >(options?: Partial<EmitterOptionsType<Endpoint, AdapterType>> & { params?: ParamsType; data?: NewPayload }) {
    const json: Partial<Emitter<NewPayload, Response, Endpoint, AdapterType, NewHasData, NewHasParams>> = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as NewPayload,
      params: options?.params || this.params,
      ...options,
      topic: this.paramsMapper(options?.params || this.params),
    };

    const newInstance = new Emitter<NewPayload, Response, Endpoint, AdapterType, NewHasData, NewHasParams>(
      this.socket,
      this.emitterOptions,
      json,
    );

    newInstance.dataMapper = this.dataMapper;

    return newInstance;
  }

  emit: EmitType<this> = (options = {}) => {
    const typedOptions = options as EmitterEmitOptionsType<this>;
    const instance = this.clone(typedOptions as any) as unknown as this;
    emitEvent(instance);
  };
}
