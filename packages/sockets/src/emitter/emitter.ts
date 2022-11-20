import { Socket } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";

export class Emitter<DataType, GlobalErrorType, AdditionalEmitterOptions, MappedData> {
  readonly event: string;
  offline: boolean;
  headers: HeadersInit;
  options: AdditionalEmitterOptions;
  data: DataType | null = null;

  constructor(
    readonly socket: Socket<GlobalErrorType, unknown, AdditionalEmitterOptions>,
    readonly emitterOptions: EmitterOptionsType<AdditionalEmitterOptions>,
    dump: Partial<Emitter<DataType, GlobalErrorType, AdditionalEmitterOptions, MappedData>>,
    readonly dataMapper: (data: DataType) => MappedData,
  ) {
    const { event, options } = {
      ...this.socket.emitterConfig?.(emitterOptions),
      ...emitterOptions,
    };

    this.event = dump?.event ?? event;
    this.data = dump?.data;
    this.offline = dump?.offline;
    this.options = dump?.options ?? options;
  }

  setOptions(options: AdditionalEmitterOptions) {
    return this.clone({ options });
  }

  setData(data: DataType) {
    return this.clone({ data });
  }

  setOffline = (offline: boolean) => {
    return this.clone({ offline });
  };

  setDataMapper = <MapperData>(mapper: (data: DataType) => MapperData) => {
    return this.clone(undefined, mapper);
  };

  clone<MapperData = MappedData>(
    options?: Partial<EmitterCloneOptionsType<DataType, AdditionalEmitterOptions>>,
    mapper?: (data: DataType) => MapperData,
  ): Emitter<DataType, GlobalErrorType, AdditionalEmitterOptions, MapperData> {
    const dump: Partial<Emitter<DataType, GlobalErrorType, AdditionalEmitterOptions, MapperData>> = {
      ...(this as any),
      ...options,
      data: options?.data || this.data,
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<DataType, GlobalErrorType, AdditionalEmitterOptions, MapperData>(
      this.socket,
      this.emitterOptions,
      dump,
      mapperFn,
    );
  }

  emit(options?: any) {
    const instance = this.clone(options);

    return this.socket.client.emit(instance);
  }
}
