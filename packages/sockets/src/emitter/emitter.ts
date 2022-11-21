import { Socket, SocketClientType } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";
import { TupleRestType } from "types";
import { WebsocketClientType } from "client";
import { ExtractEmitterOptionsType } from "types/extract.types";

export class Emitter<DataType, ClientType extends SocketClientType<WebsocketClientType>, MappedData = void> {
  readonly event: string;
  headers: HeadersInit;
  options: ExtractEmitterOptionsType<ClientType>;
  data: DataType | null = null;

  constructor(
    readonly socket: Socket<ClientType>,
    readonly emitterOptions: EmitterOptionsType<ExtractEmitterOptionsType<ClientType>>,
    dump: Partial<Emitter<DataType, ClientType, MappedData>>,
    readonly dataMapper: (data: DataType) => MappedData,
  ) {
    const { event, options } = emitterOptions;
    this.event = dump?.event ?? event;
    this.data = dump?.data;
    this.options = dump?.options ?? (options || this.socket.client.emitterOptions);
  }

  setOptions(options: ExtractEmitterOptionsType<ClientType>) {
    return this.clone({ options });
  }

  setData(data: DataType) {
    return this.clone({ data });
  }

  setDataMapper = <MapperData>(mapper: (data: DataType) => MapperData) => {
    return this.clone(undefined, mapper);
  };

  clone<MapperData = MappedData>(
    options?: Partial<EmitterCloneOptionsType<DataType, ExtractEmitterOptionsType<ClientType>>>,
    mapper?: (data: DataType) => MapperData,
  ): Emitter<DataType, ClientType, MapperData> {
    const dump: Partial<Emitter<DataType, ClientType, MapperData>> = {
      ...(this as any),
      ...options,
      data: options?.data || this.data,
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<DataType, ClientType, MapperData>(this.socket, this.emitterOptions, dump, mapperFn);
  }

  emit(
    options?: Partial<EmitterCloneOptionsType<DataType, ExtractEmitterOptionsType<ClientType>>>,
    ...rest: TupleRestType<Parameters<typeof this.socket.client.emit>>
  ) {
    const instance = this.clone(options);

    return this.socket.client.emit(instance, ...rest);
  }
}
