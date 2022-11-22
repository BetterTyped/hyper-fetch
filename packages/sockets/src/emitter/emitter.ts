import { Socket, SocketClientType } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";
import { TupleRestType } from "types";
import { WebsocketClientType } from "client";
import { ExtractEmitterOptionsType } from "types/extract.types";

export class Emitter<DataType, ClientType extends SocketClientType<WebsocketClientType>, MappedData = void> {
  readonly name: string;
  data: DataType | null = null;
  options: ExtractEmitterOptionsType<ClientType>;

  constructor(
    readonly socket: Socket<ClientType>,
    readonly emitterOptions: EmitterOptionsType<ExtractEmitterOptionsType<ClientType>>,
    dump: Partial<Emitter<DataType, ClientType, MappedData>>,
    readonly dataMapper: (data: DataType) => MappedData,
  ) {
    const { name, options } = emitterOptions;
    this.name = dump?.name ?? name;
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
    config?: Partial<EmitterCloneOptionsType<DataType, ExtractEmitterOptionsType<ClientType>>>,
    mapper?: (data: DataType) => MapperData,
  ): Emitter<DataType, ClientType, MapperData> {
    const dump: Partial<Emitter<DataType, ClientType, MapperData>> = {
      ...config,
      name: this.name,
      data: config?.data || this.data,
      options: config?.options || this.options,
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<DataType, ClientType, MapperData>(this.socket, this.emitterOptions, dump, mapperFn);
  }

  emit(
    options?: Partial<EmitterCloneOptionsType<DataType, ExtractEmitterOptionsType<ClientType>>>,
    ...rest: TupleRestType<Parameters<ClientType["emit"]>>
  ) {
    const instance = this.clone(options);

    return this.socket.client.emit(
      instance,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ...rest,
    );
  }
}
