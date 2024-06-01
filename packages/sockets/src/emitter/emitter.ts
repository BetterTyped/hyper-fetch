import { Time, ExtractRouteParams, ParamsType, TypeWithDefaults } from "@hyper-fetch/core";

import { Socket } from "socket";
import { EmitterOptionsType, EmitType, EmitterEmitOptionsType } from "emitter";
import { SocketAdapterInstance } from "adapter";
import { ExtractAdapterEmitterOptionsType } from "types";
import { emitEvent } from "./emitter.utils";

export class Emitter<
  Payload,
  Response,
  Topic extends string,
  Adapter extends SocketAdapterInstance,
  MappedData = void,
  HasParams extends boolean = false,
  HasData extends boolean = false,
> {
  readonly topic: Topic;
  params?: ParamsType;
  timeout: number;
  data: Payload | null = null;
  options: ExtractAdapterEmitterOptionsType<Adapter>;

  dataMapper?: (data: Payload) => MappedData;

  constructor(
    readonly socket: Socket<Adapter>,
    readonly emitterOptions: EmitterOptionsType<Topic, Adapter>,
    json?: Pick<
      Emitter<Payload, Response, Topic, Adapter, MappedData, HasData, HasParams>,
      "topic" | "params" | "timeout" | "data" | "options"
    >,
  ) {
    const { topic, timeout = Time.SEC * 2, options } = emitterOptions;

    this.topic = json?.topic ?? topic;
    this.data = json?.data;
    this.timeout = json?.timeout ?? timeout;
    this.options = json?.options ?? options;
    this.params = json?.params;
  }

  setOptions(options: ExtractAdapterEmitterOptionsType<Adapter>) {
    return this.clone({ options });
  }

  setTimeout(timeout: number) {
    return this.clone({ timeout });
  }

  setData(data: Payload) {
    if (this.dataMapper) {
      return this.clone<{
        payload: MappedData extends void ? Payload : MappedData;
        hasData: true;
      }>({ data: this.dataMapper(data) as MappedData extends void ? Payload : MappedData });
    }
    return this.clone<{ hasData: true }>({ data: data as any });
  }

  setDataMapper = <MapperData>(mapper: (data: Payload) => MapperData) => {
    const newInstance = this.clone<{ mappedData: MapperData }>(undefined);
    newInstance.dataMapper = mapper;
    return newInstance;
  };

  setParams(params: ExtractRouteParams<Topic>) {
    return this.clone<{ hasParams: true }>({ params });
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
    Extensions extends {
      payload?: any;
      mappedData?: any;
      hasParams?: true | false;
      hasData?: true | false;
    } = {
      payload: Payload;
      mappedData: MappedData;
      hasParams: HasParams;
      hasData: HasData;
    },
  >(
    options?: Partial<EmitterOptionsType<Topic, Adapter>> & {
      params?: ParamsType;
      data?: TypeWithDefaults<Extensions, "payload", undefined>;
    },
    mapper?: (
      data: TypeWithDefaults<Extensions, "payload", undefined>,
    ) => TypeWithDefaults<Extensions, "mappedData", void>,
  ) {
    type NewPayload = TypeWithDefaults<Extensions, "payload", Payload>;
    type NewMappedData = TypeWithDefaults<Extensions, "mappedData", MappedData>;
    type NewHasParams = TypeWithDefaults<Extensions, "hasParams", HasParams>;
    type NewHasData = TypeWithDefaults<Extensions, "hasData", HasData>;

    const json: Pick<
      Emitter<NewPayload, Response, Topic, Adapter, NewMappedData, NewHasParams, NewHasData>,
      "topic" | "params" | "timeout" | "data" | "options"
    > = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as unknown as NewPayload,
      params: options?.params || this.params,
      ...options,
      topic: this.paramsMapper(options?.params || this.params),
    };

    const newInstance = new Emitter<NewPayload, Response, Topic, Adapter, NewMappedData, NewHasParams, NewHasData>(
      this.socket,
      this.emitterOptions,
      json,
    );
    newInstance.dataMapper = (mapper || this.dataMapper) as unknown as typeof newInstance.dataMapper;
    return newInstance;
  }

  emit: EmitType<this> = (options = {}) => {
    const typedOptions = options as EmitterEmitOptionsType<this>;

    const instance = this.clone(typedOptions as any) as unknown as this;

    return emitEvent(instance, typedOptions);
  };
}
