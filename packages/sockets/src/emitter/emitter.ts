import { Time, ExtractRouteParams, ParamsType, TypeWithDefaults, getUniqueRequestId } from "@hyper-fetch/core";

import { Socket } from "socket";
import { EmitterOptionsType, EmitType, EmitterCallbackResponseType, EmitterEmitOptionsType } from "emitter";
import { SocketAdapterInstance, SocketAdapterType } from "adapter";
import { ExtractAdapterEmitterOptionsType } from "types";
import { emitEvent } from "./emitter.utils";

export class Emitter<
  Properties extends {
    payload: any;
    response: any;
    topic: string;
    adapter: SocketAdapterInstance;
    mappedData: any;
    hasParams?: boolean;
    hasData?: boolean;
  } = {
    payload: undefined;
    response: undefined;
    topic: string;
    adapter: SocketAdapterType;
    mappedData: void;
    hasParams: false;
    hasData: false;
  },
> {
  readonly topic: TypeWithDefaults<Properties, "topic", string>;
  params?: ParamsType;
  timeout: number;
  data: TypeWithDefaults<Properties, "payload", undefined> | null = null;
  options: ExtractAdapterEmitterOptionsType<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>;

  dataMapper?: (
    data: TypeWithDefaults<Properties, "payload", undefined>,
  ) => TypeWithDefaults<Properties, "mappedData", undefined>;

  constructor(
    readonly socket: Socket<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>,
    readonly emitterOptions: EmitterOptionsType<
      TypeWithDefaults<Properties, "topic", string>,
      TypeWithDefaults<Properties, "adapter", SocketAdapterType>
    >,
    json?: Pick<
      Emitter<{
        payload: TypeWithDefaults<Properties, "payload", undefined>;
        response: TypeWithDefaults<Properties, "response", undefined>;
        topic: TypeWithDefaults<Properties, "topic", string>;
        adapter: TypeWithDefaults<Properties, "adapter", SocketAdapterType>;
        mappedData: TypeWithDefaults<Properties, "mappedData", undefined>;
        hasParams: TypeWithDefaults<Properties, "hasData", false>;
        hasData: TypeWithDefaults<Properties, "hasParams", false>;
      }>,
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

  setOptions(options: ExtractAdapterEmitterOptionsType<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>) {
    return this.clone({ options });
  }

  setTimeout(timeout: number) {
    return this.clone({ timeout });
  }

  setData(data: TypeWithDefaults<Properties, "payload", undefined>) {
    if (this.dataMapper) {
      return this.clone<{
        payload: TypeWithDefaults<Properties, "mappedData", TypeWithDefaults<Properties, "payload", undefined>>;
        hasData: true;
      }>({ data: this.dataMapper(data) });
    }
    return this.clone<{ hasData: true }>({ data });
  }

  setDataMapper = <MapperData>(mapper: (data: TypeWithDefaults<Properties, "payload", undefined>) => MapperData) => {
    const newInstance = this.clone<{ mappedData: MapperData }>(undefined);
    newInstance.dataMapper = mapper;
    return newInstance;
  };

  setParams(params: ExtractRouteParams<TypeWithDefaults<Properties, "topic", string>>) {
    return this.clone<{ hasParams: true }>({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): TypeWithDefaults<Properties, "topic", string> => {
    let topic = this.emitterOptions.topic as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        topic = topic.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return topic as TypeWithDefaults<Properties, "topic", string>;
  };

  clone<
    Extensions extends {
      payload?: any;
      mappedData?: any;
      hasParams?: true | false;
      hasData?: true | false;
    } = {
      payload: TypeWithDefaults<Properties, "payload", undefined>;
      mappedData: TypeWithDefaults<Properties, "mappedData", void>;
      hasParams: TypeWithDefaults<Properties, "hasParams", false>;
      hasData: TypeWithDefaults<Properties, "hasData", false>;
    },
  >(
    options?: Partial<
      EmitterOptionsType<
        TypeWithDefaults<Properties, "topic", string>,
        TypeWithDefaults<Properties, "adapter", SocketAdapterType>
      >
    > & {
      params?: ParamsType;
      data?: TypeWithDefaults<Extensions, "payload", undefined>;
    },
    mapper?: (
      data: TypeWithDefaults<Extensions, "payload", undefined>,
    ) => TypeWithDefaults<Extensions, "mappedData", void>,
  ) {
    type NewPayload = TypeWithDefaults<Extensions, "payload", TypeWithDefaults<Properties, "payload", undefined>>;
    type NewMappedData = TypeWithDefaults<
      Extensions,
      "mappedData",
      TypeWithDefaults<Properties, "mappedData", undefined>
    >;
    type NewHasParams = TypeWithDefaults<Extensions, "hasParams", TypeWithDefaults<Properties, "hasParams", false>>;
    type NewHasData = TypeWithDefaults<Extensions, "hasData", TypeWithDefaults<Properties, "hasData", false>>;

    const json: Pick<
      Emitter<{
        payload: NewPayload;
        response: TypeWithDefaults<Properties, "response", undefined>;
        topic: TypeWithDefaults<Properties, "topic", string>;
        adapter: TypeWithDefaults<Properties, "adapter", SocketAdapterType>;
        mappedData: NewMappedData;
        hasParams: NewHasParams;
        hasData: NewHasData;
      }>,
      "topic" | "params" | "timeout" | "data" | "options"
    > = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as unknown as NewPayload,
      params: options?.params || this.params,
      ...options,
      topic: this.paramsMapper(options?.params || this.params),
    };

    const newInstance = new Emitter<{
      payload: NewPayload;
      response: TypeWithDefaults<Properties, "response", undefined>;
      topic: TypeWithDefaults<Properties, "topic", string>;
      adapter: TypeWithDefaults<Properties, "adapter", SocketAdapterType>;
      mappedData: NewMappedData;
      hasParams: NewHasParams;
      hasData: NewHasData;
    }>(this.socket, this.emitterOptions, json);
    newInstance.dataMapper = (mapper || this.dataMapper) as unknown as typeof newInstance.dataMapper;
    return newInstance;
  }

  emit: EmitType<Emitter<Properties>> = (options = {}) => {
    const typedOptions = options as EmitterEmitOptionsType<Emitter<Properties>>;

    const instance = this.clone(typedOptions as any) as unknown as Emitter<Properties>;

    return emitEvent(instance, typedOptions);
  };
}
