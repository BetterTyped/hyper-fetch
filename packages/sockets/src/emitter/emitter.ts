import { DateInterval, getUniqueRequestId } from "@hyper-fetch/core";

import { Socket } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";
import { SocketAdapterType, ExtractEmitterOptionsType } from "adapter";

export class Emitter<Payload, Response, AdapterType extends SocketAdapterType, MappedData = void> {
  readonly name: string;
  timeout: number;
  data: Payload | null = null;
  options: ExtractEmitterOptionsType<AdapterType>;

  constructor(
    readonly socket: Socket<AdapterType>,
    readonly emitterOptions: EmitterOptionsType<AdapterType>,
    json?: Partial<Emitter<Payload, Response, AdapterType, MappedData>>,
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

  clone<NewPayload = Payload, MapperData = MappedData>(
    config?: Partial<EmitterCloneOptionsType<NewPayload, AdapterType>>,
    mapper?: (data: NewPayload) => MapperData,
  ): Emitter<NewPayload, Response, AdapterType, MapperData> {
    const json: Partial<Emitter<NewPayload, Response, AdapterType, MapperData>> = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as unknown as NewPayload,
      ...config,
      name: this.name,
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<NewPayload, Response, AdapterType, MapperData>(this.socket, this.emitterOptions, json, mapperFn);
  }

  emit(
    options?: Partial<EmitterCloneOptionsType<Payload, AdapterType>>,
    ack?: (error: Error | null, response: Response) => void,
  ) {
    const instance = this.clone(options);
    const eventMessageId = getUniqueRequestId(this.name);

    this.socket.adapter.emit(eventMessageId, instance, ack);
    return eventMessageId;
  }
}
