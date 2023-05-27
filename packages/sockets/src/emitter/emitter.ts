import { DateInterval, ExtractRouteParams, ParamsType, getUniqueRequestId } from "@hyper-fetch/core";

import { Socket } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";
import { SocketAdapterType, ExtractEmitterOptionsType } from "adapter";

export class Emitter<Payload, Response, Name extends string, AdapterType extends SocketAdapterType, MappedData = void> {
  readonly name: Name;
  params?: ParamsType;
  timeout: number;
  data: Payload | null = null;
  options: ExtractEmitterOptionsType<AdapterType>;

  constructor(
    readonly socket: Socket<AdapterType>,
    readonly emitterOptions: EmitterOptionsType<Name, AdapterType>,
    json?: Partial<Emitter<Payload, Response, Name, AdapterType, MappedData>>,
    readonly dataMapper?: (data: Payload) => MappedData,
  ) {
    const { name, timeout = DateInterval.second * 2, options } = emitterOptions;
    this.name = json?.name ?? name;
    this.data = json?.data;
    this.timeout = json?.timeout ?? timeout;
    this.options = json?.options ?? options;
  }

  setOptions(options: ExtractEmitterOptionsType<AdapterType>) {
    return this.clone({ options });
  }

  setTimeout(timeout: number) {
    return this.clone({ timeout });
  }

  setData(data: Payload) {
    if (this.dataMapper) {
      return this.clone<MappedData>({ data: this.dataMapper(data) });
    }
    return this.clone({ data });
  }

  setDataMapper = <MapperData>(mapper: (data: Payload) => MapperData) => {
    return this.clone<Payload, MapperData>(undefined, mapper);
  };

  setParams(params: ExtractRouteParams<Name>) {
    return this.clone({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): Name => {
    let endpoint = this.emitterOptions.name as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return endpoint as Name;
  };

  clone<NewPayload = Payload, MapperData = MappedData>(
    options?: Partial<EmitterCloneOptionsType<NewPayload, Name, AdapterType>>,
    mapper?: (data: NewPayload) => MapperData,
  ): Emitter<NewPayload, Response, Name, AdapterType, MapperData> {
    const json: Partial<Emitter<NewPayload, Response, Name, AdapterType, MapperData>> = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as unknown as NewPayload,
      ...options,
      name: this.paramsMapper(options?.params || this.params),
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<NewPayload, Response, Name, AdapterType, MapperData>(
      this.socket,
      this.emitterOptions,
      json,
      mapperFn,
    );
  }

  emit(
    options?: Partial<EmitterCloneOptionsType<Payload, Name, AdapterType>>,
    ack?: (error: Error | null, response: Response) => void,
  ) {
    const instance = this.clone(options);
    const eventMessageId = getUniqueRequestId(this.name);

    this.socket.adapter.emit(eventMessageId, instance, ack);
    return eventMessageId;
  }
}
