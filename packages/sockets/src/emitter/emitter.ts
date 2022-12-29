import { DateInterval, getUniqueRequestId } from "@hyper-fetch/core";

import { Socket } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";
import { AdapterType } from "adapter";
import { ExtractEmitterOptionsType } from "types/extract.types";

export class Emitter<Payload, Response, Adapter extends AdapterType, MappedData = void> {
  readonly name: string;
  timeout: number;
  data: Payload | null = null;
  options: ExtractEmitterOptionsType<Adapter>;

  constructor(
    readonly socket: Socket<Adapter>,
    readonly emitterOptions: EmitterOptionsType<ExtractEmitterOptionsType<Adapter>>,
    dump?: Partial<Emitter<Payload, Response, Adapter, MappedData>>,
    readonly dataMapper?: (data: Payload) => MappedData,
  ) {
    const { name, timeout = DateInterval.second * 3, options } = emitterOptions;
    this.name = dump?.name ?? name;
    this.data = dump?.data;
    this.timeout = dump?.timeout ?? timeout;
    this.options = dump?.options ?? options;
  }

  setOptions(options: ExtractEmitterOptionsType<Adapter>) {
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
    config?: Partial<EmitterCloneOptionsType<NewPayload, ExtractEmitterOptionsType<Adapter>>>,
    mapper?: (data: NewPayload) => MapperData,
  ): Emitter<NewPayload, Response, Adapter, MapperData> {
    const dump: Partial<Emitter<NewPayload, Response, Adapter, MapperData>> = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as unknown as NewPayload,
      ...config,
      name: this.name,
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<NewPayload, Response, Adapter, MapperData>(this.socket, this.emitterOptions, dump, mapperFn);
  }

  emit(
    options?: Partial<EmitterCloneOptionsType<Payload, ExtractEmitterOptionsType<Adapter>>>,
    ack?: (error: Error | null, response: Response) => void,
  ) {
    const instance = this.clone(options);
    const eventMessageId = getUniqueRequestId(this.name);

    this.socket.adapter.emit(eventMessageId, instance, ack);
    return eventMessageId;
  }
}
