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
    return this.clone({ data });
  }

  setDataMapper = <MapperData>(mapper: (data: RequestDataType) => MapperData) => {
    return this.clone(undefined, mapper);
  };

  clone<MapperData = MappedData>(
    config?: Partial<EmitterCloneOptionsType<RequestDataType, ExtractEmitterOptionsType<ClientType>>>,
    mapper?: (data: RequestDataType) => MapperData,
  ): Emitter<RequestDataType, ResponseDataType, ClientType, MapperData> {
    const dump: Partial<Emitter<RequestDataType, ResponseDataType, ClientType, MapperData>> = {
      timeout: this.timeout,
      options: this.options,
      data: this.data,
      ...config,
      name: this.name,
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<RequestDataType, ResponseDataType, ClientType, MapperData>(
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

    return this.socket.client.emit(eventMessageId, instance, ack);
  }
}
