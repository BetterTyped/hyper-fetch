import { DateInterval, getUniqueRequestId } from "@hyper-fetch/core";

import { Socket } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";
import { WebsocketClientType } from "client";
import { ExtractEmitterOptionsType } from "types/extract.types";

export class Emitter<RequestDataType, ResponseDataType, ClientType extends WebsocketClientType, MappedData = void> {
  readonly name: string;
  timeout: number;
  data: RequestDataType | null = null;
  options: ExtractEmitterOptionsType<ClientType>;

  constructor(
    readonly socket: Socket<ClientType>,
    readonly emitterOptions: EmitterOptionsType<ExtractEmitterOptionsType<ClientType>>,
    dump?: Partial<Emitter<RequestDataType, ResponseDataType, ClientType, MappedData>>,
    readonly dataMapper?: (data: RequestDataType) => MappedData,
  ) {
    const { name, timeout = DateInterval.second * 3, options } = emitterOptions;
    this.name = dump?.name ?? name;
    this.data = dump?.data;
    this.timeout = dump?.timeout ?? timeout;
    this.options = dump?.options ?? options;
  }

  setOptions(options: ExtractEmitterOptionsType<ClientType>) {
    return this.clone({ options });
  }

  setTimeout(timeout: number) {
    return this.clone({ timeout });
  }

  setData(data: RequestDataType) {
    if (this.dataMapper) {
      return this.clone<MappedData>({ data: this.dataMapper(data) });
    }
    return this.clone({ data });
  }

  setDataMapper = <MapperData>(mapper: (data: RequestDataType) => MapperData) => {
    return this.clone<RequestDataType, MapperData>(undefined, mapper);
  };

  clone<NewRequestDataType = RequestDataType, MapperData = MappedData>(
    config?: Partial<EmitterCloneOptionsType<NewRequestDataType, ExtractEmitterOptionsType<ClientType>>>,
    mapper?: (data: NewRequestDataType) => MapperData,
  ): Emitter<NewRequestDataType, ResponseDataType, ClientType, MapperData> {
    const dump: Partial<Emitter<NewRequestDataType, ResponseDataType, ClientType, MapperData>> = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as unknown as NewRequestDataType,
      ...config,
      name: this.name,
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<NewRequestDataType, ResponseDataType, ClientType, MapperData>(
      this.socket,
      this.emitterOptions,
      dump,
      mapperFn,
    );
  }

  emit(
    options?: Partial<EmitterCloneOptionsType<RequestDataType, ExtractEmitterOptionsType<ClientType>>>,
    ack?: (error: Error | null, response: ResponseDataType) => void,
  ) {
    const instance = this.clone(options);
    const eventMessageId = getUniqueRequestId(this.name);

    this.socket.client.emit(eventMessageId, instance, ack);
    return eventMessageId;
  }
}
