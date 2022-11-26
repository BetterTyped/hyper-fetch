import { Socket } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";
import { TupleRestType } from "types";
import { WebsocketClientType } from "client";
import { ExtractEmitterOptionsType } from "types/extract.types";

export class Emitter<
  RequestDataType,
  ClientType extends Record<keyof WebsocketClientType | string, any>,
  MappedData = void,
> {
  readonly name: string;
  data: RequestDataType | null = null;
  options: ExtractEmitterOptionsType<ClientType>;

  constructor(
    readonly socket: Socket<ClientType>,
    readonly emitterOptions: EmitterOptionsType<ExtractEmitterOptionsType<ClientType>>,
    dump?: Partial<Emitter<RequestDataType, ClientType, MappedData>>,
    readonly dataMapper?: (data: RequestDataType) => MappedData,
  ) {
    const { name, options } = emitterOptions;
    this.name = dump?.name ?? name;
    this.data = dump?.data;
    this.options = dump?.options ?? (options || this.socket.client.emitterOptions);
  }

  setOptions(options: ExtractEmitterOptionsType<ClientType>) {
    return this.clone({ options });
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
  ): Emitter<RequestDataType, ClientType, MapperData> {
    const dump: Partial<Emitter<RequestDataType, ClientType, MapperData>> = {
      ...config,
      name: this.name,
      data: config?.data || this.data,
      options: config?.options || this.options,
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<RequestDataType, ClientType, MapperData>(this.socket, this.emitterOptions, dump, mapperFn);
  }

  emit(
    options?: Partial<EmitterCloneOptionsType<RequestDataType, ExtractEmitterOptionsType<ClientType>>>,
    ...rest: TupleRestType<Parameters<ClientType["emit"]>>
  ) {
    const instance = this.clone(options);

    return this.socket.client.emit(instance, ...rest);
  }
}
